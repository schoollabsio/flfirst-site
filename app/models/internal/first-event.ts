export interface FirstEvent {
  id: number;
  code: string;
  name: string;
  type: string;
  format: string;
  season: string;
  website: string | null;
  dateStart: Date;
  dateEnd: Date;
  liveStreamUrl: string | null;
  leagueName: string | null;
  leagueCode: string | null;
  leagueRemote: boolean | null;
  leagueLocation: string | null;
  locationName: string;
  locationAddress: string;
  locationCity: string;
  locationStateProvince: string;
  locationCountry: string;
  locationZip: string | null;
  locationTimezone: string;
  locationWebsite: string | null;
  opensAt: Date | null;
  closesAt: Date | null;
  open: boolean;
  deadline: Date | null;
  url: string | null;
  registered: number;
  capacity: number;
  waitlisted: number;
  waitlistCapacity: number;
  savedAt: Date;
}
