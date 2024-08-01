import { Prisma, PrismaClient } from "@prisma/client";
import { Fragment } from "./interface";
import { FirstTeam } from "../../models/internal/first-team";
import dayjs from "dayjs";

const Team = (team: FirstTeam) => `
    <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${team.number}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${team.name}
        </td>
    </tr>
`;

interface TeamsTableContext {
    prisma: PrismaClient;
}

export class TeamsTable implements Fragment {
  constructor(private context: TeamsTableContext) {}

  async render(params: { id: string }) {
    const persisted = await this.context.prisma.$queryRaw`
        SELECT *, MAX(saved_at) as saved_at
        FROM first_teams
        GROUP BY number
        ORDER BY saved_at DESC
    ` as Prisma.FirstTeamGetPayload<null>[];

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
    
            league: hasNoLeague ? null :{
                code: team.league_code,
                name: team.league_name,
                remote: team.league_remote,
                location: team.league_location,
            },
    
            rookie_year: team.rookie_year,
            website: team.website,

            savedAt: dayjs(Number(team.saved_at)),
        } as FirstTeam;
    });

    return `
            <div class="bg-white shadow-md p-4 max-w-fit min-w- mx-auto">
                <h1 class="text-4xl font-bold text-center text-gray-900">Teams</h1>
                <div class="text-center mt-5">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Number
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${teams.map(Team).join('\n')}
                            <!-- More rows can be added here -->
                        </tbody>
                    </table>                
                </div>
            </div>
        `;
  }
}
