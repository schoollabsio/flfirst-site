import { Prisma, PrismaClient } from "@prisma/client";
import { Fragment } from "./interface";
import dayjs from "dayjs";
import { FirstEvent } from "../../models/internal/first-event";

export interface EventsTableContext {
  prisma: PrismaClient;
}

const EventRow = (event: FirstEvent) => `
    <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
            <div>${event.name}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 md:hidden">
            <div class="flex flex-col gap-4 md:hidden">
                <div class="flex flex-col gap-1">
                    <div class="text-lg">${event.name}</div>
                    <div class="flex place-content-between "><div class="font-light italic">Date</div><div>${event.dateEnd.format("MMM D, YYYY")}</div></div>
                    <div class="flex place-content-between"><div class="font-light italic">Venue</div><div><a class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href="https://www.google.com/maps/search/?api=1&query=${[event.locationAddress, event.locationCity, event.locationStateProvince, event.locationZip].join('+')}">${event.locationCity}, ${event.locationStateProvince}</a></div></div>
                </div>
                <div class="flex place-content-end">
                    <div>${event.open ? `<a class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" href="${event.url}">Register</a>` : "Closed"}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitessace-nowrap text-sm text-gray-900 hidden lg:table-cell">
            ${event.type}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
            ${event.dateEnd.format("MMM D, YYYY")}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
            <a class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href="https://www.google.com/maps/search/?api=1&query=${[event.locationAddress, event.locationCity, event.locationStateProvince, event.locationZip].join('+')}">
                <span class="hidden lg:inline">${event.locationName} - </span><span>${event.locationCity}, ${event.locationStateProvince}</span>
            </a>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
            ${event.open ? `<a class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" href="${event.url}">Register</a>` : "Closed"}
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
        <div class="bg-white shadow-md p-4 max-w-fit mx-auto">
            <h1 class="text-4xl font-bold text-center text-gray-900">Events</h1>
            <div class="text-center mt-5">
                <table class="mx-auto max-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                <span class="hidden md:block">Name</span>
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:block">
                                Type
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                                Date
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                                Location
                            </th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                                <span class="hidden md:block">Registration</span><span class="md:hidden"></span>
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
