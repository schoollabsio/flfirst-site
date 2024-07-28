export interface RMTeam {
  name: string;
  number: number;
  location: {
      city: string;
      country: string;
      state_province: string;
      county: string | null;
  };
  league: {
      code: string;
      name: string;
      remote: boolean;
      location: string;
  } | null;
  rookie_year: number;
  website: string | null;
}
