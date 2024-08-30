import { Prisma, PrismaClient } from "@prisma/client";
import { Fragment } from "./interface";
import dayjs from "dayjs";
import { FirstEvent } from "../../models/internal/first-event";
import {
  InfoCard,
  InfoCardAttribute,
  InfoCardColumn,
  InfoCardContent,
  InfoCardFooter,
  InfoCardHeader,
} from "../../components/info-card";
import { InfoCategory } from "../../components/info-category";
import { A, Div, Span } from "../../utils/simple-components";

export interface EventsTableContext {
  prisma: PrismaClient;
}

const EventRow = (event: FirstEvent) => {
  const addressContent = Div({})(
    A({ class: "hover:text-blue-600", href: `https://www.google.com/maps/search/?api=1&query=${[event.locationAddress, event.locationCity, event.locationStateProvince, event.locationZip].join("+")}`, target: "_blank" })(
      Div({})(event.locationAddress),
      Div({})(`${event.locationCity} ${event.locationStateProvince}`),
    )
  );

  return InfoCard(
    InfoCardHeader(event.name, event.website && `<a href="${event.website}">${event.website?.replace(/(https?)\:\/\/(www\.)?/, "")}</a>`),
    InfoCardContent(
      InfoCardColumn(
        InfoCardAttribute("Date", event.dateEnd.format("MMM D, YYYY")),
        InfoCardAttribute("Registration Window", `${event.opensAt?.format("MMM D, YYYY")} - ${event.closesAt?.format("MMM D, YYYY")}`, !!(event.opensAt && event.closesAt)),
        InfoCardAttribute("Livestream", event.liveStreamUrl, !!event.liveStreamUrl),
        InfoCardAttribute("Registered",
          Span({})(
            event.registered.toString(),
            event.capacity > 0 ? Span({ class: "text-gray-400" })(` out of ${event.capacity}`) : "",
          ),
          event.registered > 0 || event.capacity > 0
        ),
        InfoCardAttribute("Waitlisted", 
          Span({})(
            event.registered.toString(),
            Span({ class: "text-gray-400" })(` out of ${event.capacity}`),
          ),
          event.waitlisted > 0 || event.waitlistCapacity > 0
        ),
      ),
      InfoCardColumn(
        InfoCardAttribute("Type", event.type),
        InfoCardAttribute("Address", addressContent),
        InfoCardAttribute("Venue", event.locationWebsite, !!event.locationWebsite),
      ),
    ),
    InfoCardFooter(`<a class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded" href="${event.url}" target="_blank">Register</a>`)
  );
};

export class EventsTable implements Fragment {
  constructor(private context: EventsTableContext) {}

  async render(params: { id: string }) {
    const persisted: Prisma.FirstEventGetPayload<null>[] = await this.context
      .prisma.$queryRaw`
        SELECT *, MAX(saved_at) as saved_at
        FROM first_event
        GROUP BY season, code
        ORDER BY date_end DESC
    `;
    const events: FirstEvent[] = persisted.map((event) => {
      return {
        id: event.id,
        code: event.code,
        name: event.name,
        type: event.type,
        format: event.format,
        season: event.season,
        website: event.website,
        dateStart: dayjs(event.date_start),
        dateEnd: dayjs(event.date_end),
        liveStreamUrl: event.live_stream_url,
        leagueName: event.league_name,
        leagueCode: event.league_code,
        leagueRemote: event.league_remote,
        leagueLocation: event.league_location,
        locationName: event.location_name,
        locationAddress: event.location_address,
        locationCity: event.location_city,
        locationStateProvince: event.location_state_province,
        locationCountry: event.location_country,
        locationZip: event.location_zip,
        locationTimezone: event.location_timezone,
        locationWebsite: event.location_website,
        opensAt: event.opens_at ? dayjs(event.opens_at) : null,
        closesAt: event.closes_at ? dayjs(event.closes_at) : null,
        open: event.open,
        deadline: event.deadline ? dayjs(event.deadline) : null,
        url: event.url,
        registered: event.registered || 0,
        capacity: event.capacity || 0,
        waitlisted: event.waitlisted || 0,
        waitlistCapacity: event.waitlist_capacity || 0,
        savedAt: dayjs(Number(event.saved_at)),
      };
    });

    events.sort((a, b) => {
      if (!(!a.leagueName || !b.leagueName) && a.leagueName !== b.leagueName) {
        return a.leagueName.localeCompare(b.leagueName);
      }
      return a.dateEnd.diff(b.dateEnd);
    });

    const leagueCodeToName: Record<string, string> = events.reduce(
      (acc: Record<string, string>, event: FirstEvent) => {
        const code = event.leagueCode;
        const name = event.leagueName;
        if (code && name) {
          return {
            ...acc,
            [code]: name,
          };
        }
        return acc;
      },
      {}
    );

    const leagueEvents: Record<string, FirstEvent[]> = events.reduce(
      (acc: Record<string, FirstEvent[]>, event: FirstEvent) => {
        const code = event.leagueCode;
        if (!code) {
          return acc;
        }
        return {
          ...acc,
          [code]: [...(acc[code] || []), event],
        };
      },
      {}
    );

    const leagueTables = Object.entries(leagueEvents).map(
      ([leagueCode, events]) =>
        InfoCategory(leagueCodeToName[leagueCode], events.map(EventRow))
    );

    const tableBody = leagueTables.join("\n");

    return `
        <div class="max-w-prose mx-auto">
            ${tableBody}
        </div>
    `;
  }
}
