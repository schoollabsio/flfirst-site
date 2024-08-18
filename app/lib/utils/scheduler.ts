import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Logger from "../interfaces/logger";

dayjs.extend(utc);
dayjs.extend(timezone);

interface IntervalJob {
  runOnStart: boolean;
  interval?: number;
  allowConcurrent?: boolean;
  at?: string;
  shouldRun?: (now: Dayjs) => boolean;
  timezone?: string;
  function: () => Promise<void>;
}

export const MILLISECOND = 1;
export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;

export default class Scheduler {
  intervalJobs: IntervalJob[] = [];

  intervalJobIds: NodeJS.Timeout[] = [];

  constructor(
    private context: {
      logger: Logger;
    },
  ) {}

  add(job: IntervalJob) {
    this.intervalJobs.push(job);
  }

  /**
   * starts all jobs
   */
  start() {
    const runningJobs = new Set();

    this.intervalJobs.forEach((job, index) => {
      const id = setInterval(
        () => {
          const startJob = async () => {
            if (job.allowConcurrent || !runningJobs.has(index)) {
              runningJobs.add(JSON.stringify(job));
              await job.function();
              runningJobs.delete(JSON.stringify(job));
            } else {
              this.context.logger.warn(
                "Tried to start job which is already running!",
              );
            }
          };

          if (job.at) {
            const now = dayjs().tz(job.timezone || "utc");

            const isTimeToRunJob = now.format().includes(job.at);

            if (isTimeToRunJob) {
              startJob().catch(this.context.logger.error);
            }
          } else if (job.shouldRun) {
            const now = dayjs().tz(job.timezone || "utc");
            const isTimeToRunJob = job.shouldRun(now);
            if (isTimeToRunJob) {
              startJob().catch(this.context.logger.error);
            }
          } else {
            startJob().catch(this.context.logger.error);
          }
        },
        job.interval || 1 * SECOND,
      );
      this.intervalJobIds.push(id);

      if (job.runOnStart) {
        job.function().catch(this.context.logger.error);
      }
    });
  }

  stop() {
    this.intervalJobIds.forEach((id) => clearInterval(id));
  }
}

// helpers for shouldRun

const atMidnight = (now: Dayjs) => now.hour() === 0 && now.minute() === 0 && onSecond(0)(now);
const atNoon = (now: Dayjs) => now.hour() === 12 && now.minute() === 0 && onSecond(0)(now);
const atHour = (hour: number) => (now: Dayjs) => now.hour() === hour && onMinute(0)(now) && onSecond(0)(now);

export const onSecond = (second: number) => (now: Dayjs) =>
  now.second() === second;
const onMinute = (minute: number) => (now: Dayjs) =>
  now.minute() === minute && onSecond(0)(now);

export const Hourly = {
  onTheHour: (now: Dayjs) => onMinute(0)(now) && onSecond(0)(now),
  onMinute,
  onSecond,
};

export const Daily = {
  atMidnight,
  atNoon,
  atHour,
};

export const Weekly = {
  onMonday: (now: Dayjs) => now.day() === 1 && atMidnight(now),
  onTuesday: (now: Dayjs) => now.day() === 2 && atMidnight(now),
  onWednesday: (now: Dayjs) => now.day() === 3 && atMidnight(now),
  onThursday: (now: Dayjs) => now.day() === 4 && atMidnight(now),
  onFriday: (now: Dayjs) => now.day() === 5 && atMidnight(now),
  onSaturday: (now: Dayjs) => now.day() === 6 && atMidnight(now),
  onSunday: (now: Dayjs) => now.day() === 0 && atMidnight(now),
};

export const Monthly = {
  onFirstDay: (now: Dayjs) => now.date() === 1,
  onLastDay: (now: Dayjs) => now.date() === now.daysInMonth(),
  onDay: (day: number) => (now: Dayjs) => now.date() === day,
};
