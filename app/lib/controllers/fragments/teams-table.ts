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

const DisplayLink = (url: string) => {
  return `<a href="${url}" target="_blank">${url?.toLowerCase().replace(/(https?)\:\/\/(www\.)?/, "").replace(/\/$/, '')}</a>`;
}

const TeamRow = (team: FirstTeam) => {
  return InfoCard(`
      ${InfoCardHeader(`${team.number} - ${team.name}`, team.website && `<a href="${team.website}">${DisplayLink(team.website)}</a>`)}
      ${InfoCardContent(`
        ${InfoCardColumn(`
          ${InfoCardAttribute("City", `${team.location.city}`)}
          ${InfoCardAttribute("County", `${team.location.county}`)}
        `)}
        ${InfoCardColumn(`
          ${InfoCardAttribute("Rookie Year", team.rookieYear)}
          ${InfoCardAttribute("Event Ready?", !team.eventReady ? "Yes" : `No <a class="text-sm text-gray-400 hover:text-gray-600" href="${team.url}" target='_blank'>- Coaches, get ready now -></a>`)}
        `)}
      `)}
    `);
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

    return `
        <div class="flex flex-col max-w-fit mx-auto gap-4">
            ${teams.map(TeamRow).join("\n")}
        </div>
    `;
  }
}
