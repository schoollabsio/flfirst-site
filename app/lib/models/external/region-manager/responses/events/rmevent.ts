export interface RMEvent {
  code: string;
  name: string;
  type: string;
  format: string;
  season: string;
  website?: string;
  date_start: Date;
  date_end: Date;
  live_stream_url?: string;

  league?: {
    code: string;
    name: string;
    remote?: boolean;
    location?: string;
  };

  location: {
    name: string;
    address: string;
    city: string;
    state_province: string;
    country: string;
    zip?: string;
    timezone: string;
    website?: string;
  };

  registration: {
    open: boolean;
    deadline?: Date; // deprecated, use closes_at
    url: string;
    closes_at: Date;
    opens_at: Date;
    attending: unknown[];
    capacity: number | null;
    waitlist: unknown[];
    waitlist_capacity: number | null;
  };
}
