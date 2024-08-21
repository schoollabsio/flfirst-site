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
  opensAt: Dayjs | null;
  closesAt: Dayjs | null;
  open: boolean;
  deadline: Dayjs | null;
  url: string | null;
  registered: number;
  capacity: number;
  waitlisted: number;
  waitlist_capacity: number,
  savedAt: Dayjs;
}
