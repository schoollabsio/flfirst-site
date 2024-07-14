import { Fragment } from "./interface.ts";

const Team = ({ name, number }: { name: string, number: string }) => `
    <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${name}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${number}
        </td>
    </tr>
`;

export class TeamsTable implements Fragment {

    constructor(private ctx: {
        
    }) {}

    async render(params: { id: string }) {
        const teams = [
            { name: "Team 1", number: '4318' },
            { name: "Team 2", number: '7236' },
            { name: "Team 3", number: '1234' },
            { name: "Team 4", number: '11111' },
            { name: "Team 5", number: '9087' },
            { name: "Team 6", number: '4562' },
        ];
        return `
            <div>
                <h1 class="text-4xl font-bold text-center text-gray-900">Teams</h1>
                <div class="text-center mt-5">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Number
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${teams.map(Team).join('')}
                            <!-- More rows can be added here -->
                        </tbody>
                    </table>                
                </div>
            </div>
        `;
    }
}
