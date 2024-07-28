import "dotenv/config";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { PrismaClient } from "@prisma/client";
import { Environment } from "../enums/environment";
import { FragmentController } from "../controllers/fragment-controller";
import { EventsTable } from "../controllers/fragments/events-table";
import { Fragment, Params, Query } from "../controllers/fragments/interface";
import { TeamsTable } from "../controllers/fragments/teams-table";
import { Page } from "../controllers/fragments/page";
import { VideosTable } from "../controllers/fragments/videos-table";
import { Announcements } from "../controllers/fragments/announcements";
import Scheduler, { Hourly } from "../utils/scheduler";
import RegionManagerService from "../services/region-manager-service";
import ConfigureSimpleFetch from "../utils/simple-fetch";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class Context {
  constructor(private environment: Environment) {}

  // fragments

  get page() {
    return new Page(this);
  }

  get eventsTable() {
    return new EventsTable(this);
  }

  get teamsTable() {
    return new TeamsTable(this);
  }

  get videosTable() {
    return new VideosTable(this);
  }

  get announcements() {
    return new Announcements(this);
  }

  get fragments(): { [key: string]: Fragment } {
    return {
      page: this.page,
      events: this.eventsTable,
      teams: this.teamsTable,
      videos: this.videosTable,
      announcements: this.announcements,
    };
  }

  get fragmentController() {
    return new FragmentController(this);
  }

  get app() {
    const app = Fastify();
    app.register(fastifyStatic, {
      root: process.cwd() + "/static/",
    });

    app.get("/fragments/:id", async (request, reply) => {
      const fragment = await this.fragmentController.load(
        request.params as Params,
        request.query as Query,
      );
      reply.send(fragment);
    });

    return app;
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
        host: 'https://ftcregion.com',
        season: '2024',
        region: 'USFL',
      }
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
                  "X-RM-API-Version": "2024-07-26",
                },
              },
            };
          },
        }
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
      shouldRun: Hourly.onTheHour,
      timezone: "America/New_York",
      function: async () => {
        await this.regionManagerService.syncEvents();
      },
    });

    scheduler.add({
      runOnStart: true,
      allowConcurrent: false,
      shouldRun: Hourly.onTheHour,
      timezone: "America/New_York",
      function: async () => {
        await this.regionManagerService.syncTeams();
      },
    });

    return scheduler;
  }

  async start() {
    try {
      this.scheduler.start();
      await this.app.listen({
        host: "0.0.0.0",
        port: this.settings.port,
      });
      console.log(`Server listening on http://localhost:${this.settings.port}`);
    } catch (err) {
      console.error(err);
    }
  }
}
