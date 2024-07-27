import { Prisma, PrismaClient } from "@prisma/client";
import { Fragment } from "./interface";
import dayjs from "dayjs";
import { FirstEvent } from "../../models/internal/first-event";

export interface EventsTableContext {
  prisma: PrismaClient;
}

const EventRow = (event: FirstEvent) => `
    <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${event.name}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${event.type}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${event.dateStart.format("MMM D, YYYY")} - ${event.dateEnd.format("MMM D, YYYY")}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${event.locationName}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${event.locationCity}, ${event.locationStateProvince}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${event.open ? `<a class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" href="${event.url}">Register Now</a>` : "Closed"}
        </td>
    </tr>
`;

export class EventsTable implements Fragment {
  constructor(private context: EventsTableContext) {}

  async render(params: { id: string }) {
    const persisted: Prisma.FirstEventGetPayload<null>[] = await this.context.prisma.$queryRaw`
        SELECT *, MAX(saved_at) as saved_at
        FROM first_event
        GROUP BY season, code
        ORDER BY saved_at DESC
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
        locationName: event.location_name,
        locationAddress: event.location_address,
        locationCity: event.location_city,
        locationStateProvince: event.location_state_province,
        locationCountry: event.location_country,
        locationZip: event.location_zip,
        locationTimezone: event.location_timezone,
        locationWebsite: event.location_website,
        open: event.open,
        deadline: event.deadline ? dayjs(event.deadline) : null,
        url: event.url,
        savedAt: dayjs(Number(event.saved_at)),
      };
    });

    const eventRows = events.map((event: FirstEvent) => EventRow(event));

    const tableBody = eventRows.join("\n");

    return `
            <div>
                <h1 class="text-4xl font-bold text-center text-gray-900">Events</h1>
                <div class="text-center mt-5">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Venue
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Registration
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${tableBody}
                        </tbody>
                    </table>                
                </div>
            </div>
        `;
  }
}
