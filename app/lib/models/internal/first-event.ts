import { Dayjs } from "dayjs";

export interface FirstEvent {
    id: number;
    code: string;
    name: string;
    type: string;
    format: string;
    season: string;
    website: string | null;
    dateStart: Dayjs;
    dateEnd: Dayjs;
    liveStreamUrl: string | null;
    locationName: string;
    locationAddress: string;
    locationCity: string;
    locationStateProvince: string;
    locationCountry: string;
    locationZip: string | null;
    locationTimezone: string;
    locationWebsite: string | null;
    open: boolean;
    deadline: Dayjs | null;
    url: string | null;
    savedAt: Dayjs;
};