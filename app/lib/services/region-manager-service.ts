import { PrismaClient } from "@prisma/client";
import { RMEventsResponse } from "../models/external/region-manager/responses/events/response";
import { RMTeamsResponse } from "../models/external/region-manager/responses/teams/response";
import { SimpleFetch } from "../utils/simple-fetch";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_LEAGUE = {
  code: "FLDEF",
  name: "Florida",
  remote: null,
  location: null,
};

export interface RegionaManagerServiceContext {
  simpleFetch: SimpleFetch;
  prisma: PrismaClient;
  settings: {
    regionManager: {
      host: string;
      season: string;
      region: string;
    };
  };
}

export default class RegionManagerService {
  constructor(private context: RegionaManagerServiceContext) {}

  get eventsUri(): string {
    return `${this.context.settings.regionManager.host}/api/s/${this.context.settings.regionManager.season}/r/${this.context.settings.regionManager.region}/events`;
  }

  get teamsUri(): string {
    return `${this.context.settings.regionManager.host}/api/s/${this.context.settings.regionManager.season}/r/${this.context.settings.regionManager.region}/teams`;
  }

  async syncEvents(): Promise<void> {
    const raw = await this.context.simpleFetch(this.eventsUri, {});

    const response = (await raw.json()) as RMEventsResponse;

    const events = response.data.events.map((event) => {
      const league = event.league || DEFAULT_LEAGUE;
      return {
        hash: btoa([event.code, event.season].join("|")),

        // core
        code: event.code,
        name: event.name,
        type: event.type,
        format: event.format,
        season: event.season.toString(),
        website: event.website,
        date_start: dayjs(event.date_start)
          .tz(event.location.timezone)
          .toDate(),
        date_end: dayjs(event.date_end).tz(event.location.timezone).toDate(),
        live_stream_url: event.live_stream_url,

        // league
        league_code: league?.code,
        league_name: league?.name,
        league_remote: league?.remote,
        league_location: league?.location,

        // location info
        location_name: event.location.name,
        location_address: event.location.address,
        location_city: event.location.city,
        location_state_province: event.location.state_province,
        location_country: event.location.country,
        location_zip: event.location.zip,
        location_timezone: event.location.timezone,
        location_website: event.location.website,

        // registration info
        open: event.registration.open,
        deadline: event.registration.deadline,
        url: event.registration.url,
        closes_at: dayjs(event.registration.closes_at).toDate(),
        opens_at: dayjs(event.registration.opens_at).toDate(),

        // capacity info
        capacity: event.registration.capacity,
        registered: event.registration.attending.length,
        waitlisted: event.registration.waitlist.length,
        waitlist_capacity: event.registration.waitlist_capacity,

        saved_at: dayjs().tz("America/New_York").toDate(),
      };
    });

    const eventHashs = events.map((event) => event.hash);

    const existing = await this.context.prisma.firstEvent.findMany({
      where: {
        hash: {
          in: eventHashs,
        },
      },
    });

    // FIXME: this is a naive implementation, we should be able to do this in a single query
    const creates = events.filter((event) => !existing.some((e) => e.hash === event.hash));
    const updates = events.filter((event) => existing.some((e) => e.hash === event.hash));
    const deletes = existing.filter((e) => !events.some((event) => event.hash === e.hash));

    // issue updates for all the existing records
    await Promise.all([
      ...existing.map((event) => {
        const update = updates.find((e) => e.hash === event.hash);
        if (!update) {
          console.error(`No update found for event ${event.code}!`);
          return;
        }
        return this.context.prisma.firstEvent.update({
          where: {
            id: event.id,
          },
          data: update,
        });
      }),
    ]);

    await this.context.prisma.firstEvent.createMany({
      data: creates,
    });

    await this.context.prisma.firstEvent.deleteMany({
      where: {
        hash: {
          in: deletes.map((e) => e.hash),
        },
      },
    });
  }

  async syncTeams(): Promise<void> {
    const raw = await this.context.simpleFetch(this.teamsUri, {});
    const response = (await raw.json()) as RMTeamsResponse;

    await this.context.prisma.$transaction([
      this.context.prisma.firstTeam.deleteMany({}),
      this.context.prisma.firstTeam.createMany({
        data: response.data.teams.map((team) => ({
          // core
          name: team.name,
          number: team.number.toString(),

          // location
          location_city: team.location.city,
          location_country: team.location.country,
          location_state_province: team.location.state_province,
          location_county: team.location.county,

          // league
          league_code: team.league?.code,
          league_name: team.league?.name,
          league_remote: team.league?.remote,
          league_location: team.league?.location,

          // other
          rookie_year: team.rookie_year.toString(),
          website: team.website,
          event_ready: team.event_ready,
          url: team.url,

          // saved at
          saved_at: dayjs().tz("America/New_York").toDate(),
        })),
      }),
    ]);
  }
}
