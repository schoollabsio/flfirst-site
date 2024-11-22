import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Prisma, PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  InfoCard,
  InfoCardAttribute,
  InfoCardColumn,
  InfoCardContent,
  InfoCardFooter,
  InfoCardHeader,
} from "~/components/info-card";
import { FirstEvent } from "~/models/internal/first-event";
import { InfoCategory } from "~/components/info-category";
import { useState } from "react";

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

const formatWebsiteUrl = (url: string) =>
  url.replace(/(https?):\/\/(www\.)?/, "");

const EventRow = ({ event }: { event: FirstEvent }) => {
  const venue = (
    <div>
      <a
        className="hover:text-blue-600"
        href={`https://www.google.com/maps/search/?api=1&query=${[
          event.locationAddress,
          event.locationCity,
          event.locationStateProvince,
          event.locationZip,
        ].join("+")}`}
        target="_blank"
        rel="noreferrer"
      >
        <div>{event.locationName}</div>
        <div>{event.locationAddress}</div>
        <div>{`${event.locationCity}, ${event.locationStateProvince}`}</div>
      </a>
    </div>
  );

  const isTooEarly = dayjs().isBefore(event.opensAt);
  const isTooLate = dayjs().isAfter(event.closesAt);

  let message = "Registration is unavailable for this event";

  if (isTooEarly) {
    message = "Registration for this event has not yet opened";
  }

  if (isTooLate) {
    message = "Registration for this event has closed";
  }

  const isOpen = !isTooEarly && !isTooLate && event.url;

  return (
    <InfoCard>
      <InfoCardHeader
        title={event.name}
        secondaryContent={
          event.locationWebsite && (
            <a target="_blank" rel="noreferrer" href={event.locationWebsite}>
              {formatWebsiteUrl(event.locationWebsite)}
            </a>
          )
        }
      />
      <InfoCardContent>
        <InfoCardColumn>
          <InfoCardAttribute
            label="Date"
            value={
              <span className="local-time">
                {dayjs(event.dateEnd).utc().format("MMM D, YYYY")}
              </span>
            }
          />
          <InfoCardAttribute
            label="Registration Window"
            value={
              <>
                {event.opensAt && (
                  <span
                    data-utc-time={dayjs(event.opensAt).toISOString()}
                    className="local-time mmmdyyyy"
                  >
                    {dayjs(event.opensAt).format("MMM D, YYYY")}
                  </span>
                )}{" "}
                -{" "}
                {event.closesAt && (
                  <span
                    data-utc-time={event.closesAt.toISOString()}
                    className="local-time mmmdyyyy"
                  >
                    {dayjs(event.closesAt).format("MMM D, YYYY")}
                  </span>
                )}
              </>
            }
            shouldDisplay={!!(event.opensAt && event.closesAt)}
          />
          <InfoCardAttribute
            label="Livestream"
            value={event.liveStreamUrl}
            shouldDisplay={!!event.liveStreamUrl}
          />
          <InfoCardAttribute
            label="Registered"
            value={
              <span>
                {event.registered.toString()}
                {event.capacity > 0 && (
                  <span className="text-gray-400">
                    {" "}
                    out of {event.capacity}
                  </span>
                )}
              </span>
            }
            shouldDisplay={event.registered > 0 || event.capacity > 0}
          />
          <InfoCardAttribute
            label="Waitlisted"
            value={
              <span>
                {event.waitlisted.toString()}
                <span className="text-gray-400">
                  {" "}
                  out of {event.waitlistCapacity}
                </span>
              </span>
            }
            shouldDisplay={event.waitlisted > 0 || event.waitlistCapacity > 0}
          />
        </InfoCardColumn>
        <InfoCardColumn>
          <InfoCardAttribute label="Type" value={event.type} />
          <InfoCardAttribute label="Venue" value={venue} />
        </InfoCardColumn>
      </InfoCardContent>
      <InfoCardFooter>
        {isOpen ? (
          <a
            className="text-white py-2 px-4 rounded bg-blue-500 hover:bg-blue-700"
            href={event.url || ""}
            target="_blank"
            rel="noreferrer"
          >
            Register
          </a>
        ) : (
          <div className="flex items-center gap-4">
            <span className="italic text-gray-400">{message}</span>
            <span className="text-white py-2 px-4 rounded bg-gray-400">
              Register
            </span>
          </div>
        )}
      </InfoCardFooter>
    </InfoCard>
  );
};

export const loader = async () => {
  const persisted: Prisma.FirstEventGetPayload<null>[] = await prisma.$queryRaw`
    SELECT *, MAX(saved_at) as saved_at
    FROM first_event
    GROUP BY season, code
    ORDER BY date_end DESC
  `;

  const events: FirstEvent[] = persisted.map((event: any) => ({
    id: event.id,
    code: event.code,
    name: event.name,
    type: event.type,
    format: event.format,
    season: event.season,
    website: event.website,
    dateStart: dayjs(event.date_start).toDate(),
    dateEnd: dayjs(event.date_end).toDate(),
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
    opensAt: event.opens_at ? dayjs(event.opens_at).toDate() : null,
    closesAt: event.closes_at ? dayjs(event.closes_at).toDate() : null,
    open: event.open,
    deadline: event.deadline ? dayjs(event.deadline).toDate() : null,
    url: event.url,
    registered: event.registered || 0,
    capacity: event.capacity || 0,
    waitlisted: event.waitlisted || 0,
    waitlistCapacity: event.waitlist_capacity || 0,
    savedAt: dayjs(Number(event.saved_at)).toDate(),
  }));

  events.sort((a, b) => {
    if (!(!a.leagueName || !b.leagueName) && a.leagueName !== b.leagueName) {
      return a.leagueName.localeCompare(b.leagueName);
    }
    return dayjs(a.dateEnd).diff(dayjs(b.dateEnd));
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
    {},
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
    {},
  );

  return json({ leagueEvents, leagueCodeToName });
};

const includesEvent =
  (searchTerm: string) => (event: Pick<FirstEvent, "name" | "locationName">) =>
    event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.locationName?.toLowerCase().includes(searchTerm.toLowerCase());

export default function Events() {
  const { leagueEvents, leagueCodeToName } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full md:min-w-[750px] md:max-w-prose">
      <div className="w-full flex flex-col items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search events..."
          className="md:w-2/3 w-full p-2 mb-4 border rounded bg-white"
        />
      </div>
      <div className="w-full">
        {Object.entries(leagueEvents)
          .sort(([aLeagueCode], [bLeagueCode]) => {
            if (aLeagueCode === "FLDEF") return -1;
            if (bLeagueCode === "FLDEF") return 1;
            return 0;
          })

          // stage 1 filters out leagues that don't have any events that match the search term
          .filter(([_, events]) => events.some(includesEvent(searchTerm)))
          .map(([leagueCode, events]) => (
            <InfoCategory
              key={leagueCode}
              header={leagueCodeToName[leagueCode]}
            >
              {events.filter(includesEvent(searchTerm)).map((event) => (
                <EventRow
                  key={event.id}
                  event={{
                    ...event,
                    dateStart: dayjs(event.dateStart).toDate(),
                    dateEnd: dayjs(event.dateEnd).toDate(),
                    opensAt: event.opensAt
                      ? dayjs(event.opensAt).toDate()
                      : null,
                    closesAt: event.closesAt
                      ? dayjs(event.closesAt).toDate()
                      : null,
                    deadline: event.deadline
                      ? dayjs(event.deadline).toDate()
                      : null,
                    savedAt: dayjs(event.savedAt).toDate(),
                  }}
                />
              ))}
            </InfoCategory>
          ))}
      </div>
    </div>
  );
}
