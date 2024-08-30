import { Prisma, PrismaClient } from "@prisma/client";
import { Fragment } from "./interface";
import { FirstTeam } from "../../models/internal/first-team";
import dayjs from "dayjs";
import {
  InfoCard,
  InfoCardAttribute,
  InfoCardColumn,
  InfoCardContent,
  InfoCardHeader,
} from "../../components/info-card";
import { A, Div, H2, If, Span } from "../../utils/simple-components";
import { InfoCategory } from "../../components/info-category";
import { ArrowRight } from "../../components/icons/arrow-right";

const DisplayLink = (url: string) => {
  return `<a href="${url}" target="_blank">${url
    ?.toLowerCase()
    .replace(/(https?)\:\/\/(www\.)?/, "")
    .replace(/\/$/, "")}</a>`;
};

const TeamRow = (team: FirstTeam) => {
  return InfoCard(
    InfoCardHeader(
      `${team.number} - ${team.name}`,
      If(!!team.website)(
        A({ href: team.website || "" })(DisplayLink(team.website || "")),
        ""
      )
    ),
    InfoCardContent(
      InfoCardColumn(
        InfoCardAttribute("City", `${team.location.city}`),
        InfoCardAttribute("County", `${team.location.county}`)
      ),
      InfoCardColumn(
        InfoCardAttribute("Rookie Year", team.rookieYear),
        InfoCardAttribute(
          "Event Ready?",
          !team.eventReady
            ? "Yes"
            : Span({})(
                A({
                  href: team.url,
                  target: "_blank",
                })(Span()("No - "), Span({ class: "text-sm text-gray-400 hover:text-blue-600", })("Coaches, get ready now", ArrowRight({ class: "inline" })))
              )
        )
      )
    )
  );
};

interface TeamsTableContext {
  prisma: PrismaClient;
}

export class TeamsTable implements Fragment {
  constructor(private context: TeamsTableContext) {}

  async render(params: { id: string }) {
    const persisted = (await this.context.prisma.$queryRaw`
        SELECT *
        FROM first_teams
        ORDER BY website is null, CAST(number as INTEGER) ASC
    `) as Prisma.FirstTeamGetPayload<null>[];
    console.log(persisted);

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

        savedAt: dayjs(Number(team.saved_at)),
      } as FirstTeam;
    });

    const groupedTeams = teams.reduce(
      (acc, team) => {
        const leagueCode = team.league?.code || "Unknown";
        if (!acc[leagueCode]) {
          acc[leagueCode] = [];
        }
        acc[leagueCode].push(team);
        return acc;
      },
      {} as Record<string, FirstTeam[]>
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
      {}
    );

    const leagueTable = Object.entries(groupedTeams)
      .map(([leagueCode, teams]) => {
        const leagueName = leagueCodeToName[leagueCode] || "Unknown";
        return InfoCategory(leagueName, teams.map(TeamRow));
      })
      .join("\n");

    return Div({ class: "flex flex-col max-w-prose mx-auto" })(leagueTable);
  }
}
