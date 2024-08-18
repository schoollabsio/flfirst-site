import { RMTeam } from "./rmteam";

export interface RMTeamsResponse {
  data: {
    teams: RMTeam[];
    team_count: number;
  };
  success: boolean;
  errors: null;
}
