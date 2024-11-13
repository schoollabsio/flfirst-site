import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Prisma, PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import {
  InfoCard,
  InfoCardAttribute,
  InfoCardColumn,
  InfoCardContent,
  InfoCardHeader,
} from "~/components/info-card";
import { FirstTeam } from "~/models/internal/first-team";
import { InfoCategory } from "~/components/info-category";
import { ArrowRight } from "~/components/icons/arrow-right";
import { useState } from "react";

const DisplayLink = ({ url }: { url: string }) => {
  const displayUrl = url
    ?.toLowerCase()
    .replace(/(https?)\:\/\/(www\.)?/, "")
    .replace(/\/$/, "");

  return (
    <a href={url} target="_blank" rel="noreferrer">
      {displayUrl}
    </a>
  );
};

const TeamRow = ({ team }: { team: FirstTeam }) => {
  return (
    <InfoCard>
      <InfoCardHeader
        title={`${team.number} - ${team.name}`}
        secondaryContent={team.website && <DisplayLink url={team.website} />}
      />
      <InfoCardContent>
        <InfoCardColumn>
          <InfoCardAttribute label="City" value={team.location.city} />
          <InfoCardAttribute label="County" value={team.location.county} />
        </InfoCardColumn>
        <InfoCardColumn>
          <InfoCardAttribute label="Rookie Year" value={team.rookieYear} />
          <InfoCardAttribute
            label="Event Ready?"
            value={
              team.eventReady ? (
                "Yes"
              ) : (
                <a href={team.url} target="_blank" rel="noreferrer">
                  <span>No - </span>
                  <span className="text-sm text-gray-400 hover:text-blue-600">
                    Coaches, get ready now
                    <ArrowRight className="inline" />
                  </span>
                </a>
              )
            }
          />
        </InfoCardColumn>
      </InfoCardContent>
    </InfoCard>
  );
};

export const loader: LoaderFunction = async () => {
  const prisma = new PrismaClient();

  const persisted = (await prisma.$queryRaw`
    SELECT *
    FROM first_teams
    ORDER BY website is null, CAST(number as INTEGER) ASC
  `) as Prisma.FirstTeamGetPayload<null>[];

  const teams = persisted.map((team) => {
    const hasNoLeague = !team.league_code || !team.league_name;
    return {
      id: team.id,
      name: team.name,
      number: team.number,
      location: {
        city: team.location_city,
        country: team.location_country,
        state_province: team.location_state_province,
        county: team.location_county,
      },
      league: hasNoLeague
        ? null
        : {
            code: team.league_code,
            name: team.league_name,
            remote: team.league_remote,
            location: team.league_location,
          },
      rookieYear: team.rookie_year,
      website: team.website,
      url: team.url,
      eventReady: team.event_ready,
      savedAt: dayjs(Number(team.saved_at)).toDate(),
    } as FirstTeam;
  });

  return json({ teams });
};

export default function Teams() {
  const { teams } = useLoaderData<{ teams: FirstTeam[] }>();

  const [searchTerm, setSearchTerm] = useState("");

  const groupedTeams = teams
    .filter(
      (team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.number
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        team.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.location.state_province
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    )
    .reduce(
      (acc, team) => {
        const leagueCode = team.league?.code || "Unknown";
        if (!acc[leagueCode]) {
          acc[leagueCode] = [];
        }
        acc[leagueCode].push(team);
        return acc;
      },
      {} as Record<string, FirstTeam[]>,
    );

  const leagueCodeToName: Record<string, string> = teams.reduce(
    (acc: Record<string, string>, team: FirstTeam) => {
      const league = team.league;
      if (!league) return acc;
      return {
        ...acc,
        [league.code]: league.name,
      };
    },
    {},
  );

  return (
    <div className="w-full md:min-w-[750px] md:max-w-prose">
      <div className="w-full flex flex-col items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search teams..."
          className="md:w-2/3 w-full p-2 mb-4 border rounded bg-white"
        />
      </div>
      <div className="flex flex-col w-full mx-auto">
        {Object.entries(groupedTeams).map(([leagueCode, teams]) => (
          <InfoCategory
            key={leagueCode}
            header={leagueCodeToName[leagueCode] || "Unknown"}
          >
            {teams.map((team) => (
              <TeamRow key={team.number} team={team} />
            ))}
          </InfoCategory>
        ))}
      </div>
    </div>
  );
}
