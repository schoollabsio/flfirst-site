import "dotenv/config";
import { PrismaClient } from "@prisma/client";

import Scheduler, { Every } from "../utils/scheduler";
import RegionManagerService from "../services/region-manager-service";
import ConfigureSimpleFetch from "../utils/simple-fetch";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import fs from "fs/promises";
import { Environment } from "~/models/enums/environment";

dayjs.extend(utc);
dayjs.extend(timezone);

export class Context {
  constructor(private environment: Environment) {}

  get fs() {
    return fs;
  }

  get prisma() {
    return new PrismaClient({
      datasources: {
        db: {
          url: this.settings.db.url,
        },
      },
    });
  }

  get settings() {
    return {
      environment: this.environment,
      port: Number(process.env.PORT || 80),
      db: {
        url: process.env.DATABASE_URL || "",
        authToken: process.env.AUTH_TOKEN,
      },
      regionManager: {
        host: "https://ftcregion.com",
        season: "2025",
        region: "USFL",
      },
    };
  }

  get logger() {
    return console;
  }

  get fetch() {
    return fetch;
  }

  get simpleFetch() {
    return ConfigureSimpleFetch({
      fetch: this.fetch,
      transformers: [
        {
          match: (url, opts) => url.includes("ftcregion.com"),
          pre: async (url, opts) => {
            return {
              url,
              opts: {
                ...opts,
                headers: {
                  ...opts.headers,
                  "X-RM-API-Version": "2024-08-13",
                },
              },
            };
          },
        },
      ],
    });
  }

  get regionManagerService() {
    return new RegionManagerService(this);
  }

  get scheduler() {
    const scheduler = new Scheduler(this);

    scheduler.add({
      runOnStart: true,
      allowConcurrent: false,
      shouldRun: Every.minute,
      timezone: "America/New_York",
      function: async () => {
        try {
          this.logger.info("Syncing events...");
          await this.regionManagerService.syncEvents();
          this.logger.info("Finished syncing events.");
        } catch (e) {
          this.logger.error(e);
        }
      },
    });

    scheduler.add({
      runOnStart: true,
      allowConcurrent: false,
      shouldRun: Every.minute,
      timezone: "America/New_York",
      function: async () => {
        try {
          this.logger.info("Syncing teams...");
          await this.regionManagerService.syncTeams();
          this.logger.info("Finished syncing teams.");
        } catch (e) {
          this.logger.error(e);
        }
      },
    });

    scheduler.add({
      runOnStart: true,
      allowConcurrent: false,
      shouldRun: Every.minute,
      timezone: "America/New_York",
      function: async () => {
        try {
          this.logger.info("Syncing videos...");
          await this.regionManagerService.syncVideos();
          this.logger.info("Finished syncing videos.");
        } catch (e) {
          this.logger.error(e);
        }
      },
    });

    return scheduler;
  }

  async start() {
    try {
      this.scheduler.start();
      console.log(`jobs started`);
    } catch (err) {
      console.error(err);
    }
  }
}
