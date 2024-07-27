export interface FirstTeam {
    name: string;
    number: number;
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
    };
    rookie_year: number;
    website: string | null;
}
