import { RMEvent } from "./rmevent";

export interface RMEventsResponse {
  data: {
    events: RMEvent[];
    event_count: number;
  };
  success: boolean;
  errors: null;
}
