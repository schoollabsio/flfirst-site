import { PrismaClient } from "@prisma/client";
import { RMEventsResponse } from "../models/external/region-manager/responses/events/response";
import { SimpleFetch } from "../utils/simple-fetch";
import dayjs from "dayjs";

export interface RegionaManagerServiceContext {
    simpleFetch: SimpleFetch
    prisma: PrismaClient
    settings: {
        regionManager: {
            host: string;
            season: string;
            region: string;
        }
    }
}

export default class RegionManagerService {
    constructor(private context: RegionaManagerServiceContext) {}

    get eventsUri(): string {
        return `${this.context.settings.regionManager.host}/api/s/${this.context.settings.regionManager.season}/r/${this.context.settings.regionManager.region}/events`;
    }

    async syncEvents(): Promise<void> {
        const raw = await this.context.simpleFetch(this.eventsUri, {});

        const response = await raw.json() as RMEventsResponse;

        // FIXME: This is a naive implementation that will delete all events and re-create them
        await this.context.prisma.firstEvent.createMany({
            data: response.data.events.map((event) => ({
                code: event.code,
                name: event.name,
                type: event.type,
                format: event.format,
                season: event.season.toString(),
                website: event.website,
                date_start: dayjs(event.date_start).tz(event.location.timezone).toDate(),
                date_end: dayjs(event.date_end).tz(event.location.timezone).toDate(),
                live_stream_url: event.live_stream_url,

                // location info
                location_name: event.location.name,
                location_address: event.location.address,
                location_city: event.location.city,
                location_state_province: event.location.state_province,
                location_country: event.location.country,
                location_zip: event.location.zip,
                location_timezone: event.location.timezone,
                location_website: event.location.website,

                // registraion info
                open: event.registration.open,
                deadline: event.registration.deadline,
                url: event.registration.url,

                saved_at: dayjs().tz("America/New_York").toDate()
            }))
        });

    }
}
