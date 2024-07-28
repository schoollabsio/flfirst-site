import { Dayjs } from "dayjs";

export interface FirstTeam {
    name: string;
    number: string;
    location: {
        city: string;
        country: string;
        state_province: string;
        county: string;
    };
    league: {
        code: string;
        name: string;
        remote: boolean;
        location: string;
    } | null;
    rookie_year: string;
    website: string | null;
    savedAt: Dayjs;
}
