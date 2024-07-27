export interface RMTeam {
  name: string;
  number: number;
  location: {
      city: string;
      country: string;
      stateProvince: string;
      county: string;
  };
  league: {
      code: string;
      name: string;
      remote: boolean;
      location: string;
  };
  rookieYear: number;
  website: string | null;
}
