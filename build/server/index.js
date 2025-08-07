var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, json, redirect } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, useLoaderData } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import fs from "fs/promises";
import { marked } from "marked";
import { useState } from "react";
dayjs.extend(utc);
dayjs.extend(timezone);
const SECOND = 1e3;
class Scheduler {
  constructor(context) {
    __publicField(this, "intervalJobs", []);
    __publicField(this, "intervalJobIds", []);
    this.context = context;
  }
  add(job) {
    this.intervalJobs.push(job);
  }
  /**
   * starts all jobs
   */
  start() {
    const runningJobs = /* @__PURE__ */ new Set();
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
                "Tried to start job which is already running!"
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
        job.interval || 1 * SECOND
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
const onSecond = (second) => (now) => now.second() === second;
const onMinute = (minute) => (now) => now.minute() === minute && onSecond(0)(now);
const Every = {
  minute: onSecond(0),
  hour: onMinute(0)
};
dayjs.extend(utc);
dayjs.extend(timezone);
const DEFAULT_LEAGUE = {
  code: "FLDEF",
  name: "Florida Region",
  remote: null,
  location: null
};
class RegionManagerService {
  constructor(context) {
    this.context = context;
  }
  get eventsUri() {
    return `${this.context.settings.regionManager.host}/api/s/${this.context.settings.regionManager.season}/r/${this.context.settings.regionManager.region}/events`;
  }
  get teamsUri() {
    return `${this.context.settings.regionManager.host}/api/s/${this.context.settings.regionManager.season}/r/${this.context.settings.regionManager.region}/teams`;
  }
  get videosUri() {
    return `${this.context.settings.regionManager.host}/api/s/${this.context.settings.regionManager.season}/r/${this.context.settings.regionManager.region}/videos`;
  }
  async syncEvents() {
    const raw = await this.context.simpleFetch(this.eventsUri, {});
    const response = await raw.json();
    const events = response.data.events.map((event) => {
      var _a, _b, _c, _d, _e, _f, _g;
      const league = event.league || DEFAULT_LEAGUE;
      const isDefaultLeague = league.code === DEFAULT_LEAGUE.code;
      return {
        hash: btoa([event.code, event.season].join("|")),
        // core
        code: event.code,
        name: event.name,
        type: event.type,
        format: event.format,
        season: event.season.toString(),
        website: event.website,
        date_start: dayjs(event.date_start).tz(event.location.timezone).toDate(),
        date_end: dayjs(event.date_end).tz(event.location.timezone).toDate(),
        live_stream_url: event.live_stream_url,
        virtual: event.virtual || false,
        // league
        league_code: league.code,
        league_name: isDefaultLeague ? league.name : league.name + " League",
        league_remote: league.remote,
        league_location: league.location,
        // location info
        location_name: event.location.name,
        location_address: event.location.address,
        location_city: event.location.city,
        location_state_province: event.location.state_province,
        location_country: event.location.country,
        location_zip: event.location.zip,
        location_timezone: event.location.timezone,
        location_website: event.location.website,
        // registration info
        open: ((_a = event.registration) == null ? void 0 : _a.open) || false,
        deadline: (_b = event.registration) == null ? void 0 : _b.deadline,
        url: (_c = event.registration) == null ? void 0 : _c.url,
        closes_at: event.registration ? dayjs(event.registration.closes_at).toDate() : null,
        opens_at: event.registration ? dayjs(event.registration.opens_at).toDate() : null,
        // capacity info
        capacity: (_d = event.registration) == null ? void 0 : _d.capacity,
        registered: (_e = event.registration) == null ? void 0 : _e.attending.length,
        waitlisted: (_f = event.registration) == null ? void 0 : _f.waitlist.length,
        waitlist_capacity: (_g = event.registration) == null ? void 0 : _g.waitlist_capacity,
        saved_at: dayjs().tz("America/New_York").toDate()
      };
    });
    const eventHashs = events.map((event) => event.hash);
    const existing = await this.context.prisma.firstEvent.findMany({
      where: {
        hash: {
          in: eventHashs
        }
      }
    });
    const creates = events.filter(
      (event) => !existing.some((e) => e.hash === event.hash)
    );
    const updates = events.filter(
      (event) => existing.some((e) => e.hash === event.hash)
    );
    const deletes = existing.filter(
      (e) => !events.some((event) => event.hash === e.hash)
    );
    await Promise.all([
      ...existing.map((event) => {
        const update = updates.find((e) => e.hash === event.hash);
        if (!update) {
          console.error(`No update found for event ${event.code}!`);
          return;
        }
        return this.context.prisma.firstEvent.update({
          where: {
            id: event.id
          },
          data: update
        });
      })
    ]);
    await this.context.prisma.firstEvent.createMany({
      data: creates
    });
    await this.context.prisma.firstEvent.deleteMany({
      where: {
        hash: {
          in: deletes.map((e) => e.hash)
        }
      }
    });
  }
  async syncTeams() {
    const raw = await this.context.simpleFetch(this.teamsUri, {});
    const response = await raw.json();
    const teams = response.data.teams.map((team) => {
      var _a, _b, _c, _d;
      return {
        // core
        name: team.name,
        number: team.number,
        // location
        location_city: team.location.city,
        location_country: team.location.country,
        location_state_province: team.location.state_province,
        location_county: team.location.county,
        // league
        league_code: (_a = team.league) == null ? void 0 : _a.code,
        league_name: (_b = team.league) == null ? void 0 : _b.name,
        league_remote: (_c = team.league) == null ? void 0 : _c.remote,
        league_location: (_d = team.league) == null ? void 0 : _d.location,
        // other
        rookie_year: team.rookie_year.toString(),
        website: team.website,
        event_ready: team.event_ready,
        url: team.url,
        // saved at
        saved_at: dayjs().tz("America/New_York").toDate()
      };
    });
    const existing = await this.context.prisma.firstTeam.findMany({
      where: {
        number: {
          in: teams.map((team) => team.number)
        }
      }
    });
    const creates = teams.filter(
      (team) => !existing.some((e) => e.number === team.number)
    );
    const updates = teams.filter(
      (team) => existing.some((e) => e.number === team.number)
    );
    const deletes = existing.filter(
      (e) => !teams.some((team) => team.number === e.number)
    );
    await Promise.all([
      ...existing.map((team) => {
        const update = updates.find((t) => t.number === team.number);
        if (!update) {
          console.error(`No update found for team ${team.number}!`);
          return;
        }
        return this.context.prisma.firstTeam.update({
          where: {
            id: team.id
          },
          data: update
        });
      })
    ]);
    await this.context.prisma.firstTeam.createMany({
      data: creates
    });
    await this.context.prisma.firstTeam.deleteMany({
      where: {
        number: {
          in: deletes.map((t) => t.number)
        }
      }
    });
    await this.context.prisma.$transaction([
      this.context.prisma.firstTeam.deleteMany({}),
      this.context.prisma.firstTeam.createMany({
        data: response.data.teams.map((team) => {
          var _a, _b, _c, _d;
          return {
            // core
            name: team.name,
            number: team.number,
            // location
            location_city: team.location.city,
            location_country: team.location.country,
            location_state_province: team.location.state_province,
            location_county: team.location.county,
            // league
            league_code: (_a = team.league) == null ? void 0 : _a.code,
            league_name: (_b = team.league) == null ? void 0 : _b.name,
            league_remote: (_c = team.league) == null ? void 0 : _c.remote,
            league_location: (_d = team.league) == null ? void 0 : _d.location,
            // other
            rookie_year: team.rookie_year.toString(),
            website: team.website,
            event_ready: team.event_ready,
            url: team.url,
            // saved at
            saved_at: dayjs().tz("America/New_York").toDate()
          };
        })
      })
    ]);
  }
  async syncVideos() {
    const raw = await this.context.simpleFetch(this.videosUri, {});
    const response = await raw.json();
    const videos = response.data.videos.map((video) => ({
      event_code: video.event_code,
      event_name: video.event_name,
      team: video.team,
      award: video.award,
      url: video.url,
      available_at: dayjs(video.available_at).toDate(),
      saved_at: dayjs().tz("America/New_York").toDate()
    }));
    const existing = await this.context.prisma.firstVideo.findMany();
    const existingKeys = new Set(
      existing.map((v) => `${v.event_code}-${v.team}-${v.award}`)
    );
    const toCreate = videos.filter(
      (v) => !existingKeys.has(`${v.event_code}-${v.team}-${v.award}`)
    );
    const toUpdate = videos.filter(
      (v) => existingKeys.has(`${v.event_code}-${v.team}-${v.award}`)
    );
    await this.context.prisma.$transaction([
      ...toUpdate.map(
        (video) => this.context.prisma.firstVideo.updateMany({
          where: {
            event_code: video.event_code,
            team: video.team,
            award: video.award
          },
          data: video
        })
      ),
      this.context.prisma.firstVideo.createMany({
        data: toCreate
      })
    ]);
  }
}
const ConfigureSimpleFetch = (context) => {
  return async (url, opts) => {
    const transformer = context.transformers.find((t) => t.match(url, opts));
    if (transformer) {
      const { url: newUrl, opts: newOpts } = await transformer.pre(url, opts);
      return context.fetch(newUrl, newOpts);
    }
    return context.fetch(url, opts);
  };
};
dayjs.extend(utc);
dayjs.extend(timezone);
class Context {
  constructor(environment) {
    this.environment = environment;
  }
  get fs() {
    return fs;
  }
  get prisma() {
    return new PrismaClient({
      datasources: {
        db: {
          url: this.settings.db.url
        }
      }
    });
  }
  get settings() {
    return {
      environment: this.environment,
      port: Number(process.env.PORT || 80),
      db: {
        url: process.env.DATABASE_URL || "",
        authToken: process.env.AUTH_TOKEN
      },
      regionManager: {
        host: "https://ftcregion.com",
        season: "2025",
        region: "USFL"
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
                  "X-RM-API-Version": "2024-08-13"
                }
              }
            };
          }
        }
      ]
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
      }
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
      }
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
      }
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
const ABORT_DELAY = 5e3;
const ctx = new Context(process.env.ENVIRONMENT);
ctx.start();
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
  }
];
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { className: "bg-gray-100 flex flex-col min-h-screen pt-16 pb-20 bg-cover bg-fixed", children: [
      /* @__PURE__ */ jsxs("nav", { className: "bg-white shadow-md w-full fixed top-0 z-10", children: [
        /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-2 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-between h-16", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center", children: /* @__PURE__ */ jsx("a", { href: "/", className: "flex-shrink-0", children: /* @__PURE__ */ jsx(
            "img",
            {
              className: "h-8 w-auto",
              src: "FIRSTTech_iconHorz_RGB.png",
              alt: "Logo"
            }
          ) }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-end", children: /* @__PURE__ */ jsx("div", { className: "hidden sm:block", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-4", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                id: "newsletter",
                href: "/newsletter",
                className: "text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium",
                children: "Newsletter"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                id: "leagues",
                href: "/leagues",
                className: "text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium",
                children: "Leagues"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                id: "events",
                href: "/events",
                className: "text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium",
                children: "Events"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                id: "teams",
                href: "/teams",
                className: "text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium",
                children: "Teams"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                id: "gallery",
                href: "/gallery",
                className: "text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium",
                children: "Gallery"
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                id: "videos",
                href: "/videos",
                className: "text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium",
                children: "Videos"
              }
            )
          ] }) }) }),
          /* @__PURE__ */ jsx(
            "div",
            {
              id: "menu-button",
              className: "absolute inset-y-0 right-0 flex items-center sm:hidden",
              onClick: () => {
                const mobileMenu = document.getElementById("mobile-menu");
                if (mobileMenu) {
                  mobileMenu.classList.toggle("hidden");
                }
              },
              children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white",
                  "aria-controls": "mobile-menu",
                  "aria-expanded": "false",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Open main menu" }),
                    /* @__PURE__ */ jsx(
                      "svg",
                      {
                        className: "block h-6 w-6",
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor",
                        "aria-hidden": "true",
                        children: /* @__PURE__ */ jsx(
                          "path",
                          {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M4 6h16M4 12h16m-7 6h7"
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "svg",
                      {
                        className: "hidden h-6 w-6",
                        xmlns: "http://www.w3.org/2000/svg",
                        fill: "none",
                        viewBox: "0 0 24 24",
                        stroke: "currentColor",
                        "aria-hidden": "true",
                        children: /* @__PURE__ */ jsx(
                          "path",
                          {
                            "stroke-linecap": "round",
                            "stroke-linejoin": "round",
                            "stroke-width": "2",
                            d: "M6 18L18 6M6 6l12 12"
                          }
                        )
                      }
                    )
                  ]
                }
              )
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "hidden", id: "mobile-menu", children: /* @__PURE__ */ jsxs("div", { className: "px-2 pt-2 pb-3 space-y-1", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              id: "newsletter-mobile",
              href: "/newsletter",
              className: "text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium",
              children: "Newsletter"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              id: "leagues-mobile",
              href: "/leagues",
              className: "text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium",
              children: "Leagues"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              id: "events-mobile",
              href: "/events",
              className: "text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium",
              children: "Events"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              id: "events-mobile",
              href: "/teams",
              className: "text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium",
              children: "Teams"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              id: "gallery-mobile",
              href: "/gallery",
              className: "text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium",
              children: "Gallery"
            }
          ),
          /* @__PURE__ */ jsx(
            "a",
            {
              id: "videos-mobile",
              href: "/videos",
              className: "text-gray-700 hover:bg-gray-200 block px-3 py-2 rounded-md text-base font-medium",
              children: "Videos"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center pt-5 px-5 text-black", children: [
        children,
        /* @__PURE__ */ jsxs("div", { className: "w-full flex justify-center items-center py-4 px-6 fixed bottom-0 bg-white drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)]", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-start", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
            "a",
            {
              className: "block w-full text-center",
              href: "https://www.rtx.com/",
              target: "_blank",
              children: /* @__PURE__ */ jsx(
                "img",
                {
                  className: "h-8 w-auto inline-block",
                  src: "rtx-black.jpg",
                  alt: "RTX"
                }
              )
            }
          ) }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center gap-4", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
            "a",
            {
              className: "block w-full text-center",
              href: "https://www.rtx.com/",
              target: "_blank",
              children: /* @__PURE__ */ jsx(
                "img",
                {
                  className: "h-8 w-auto inline-block",
                  src: "VisitCF_4cHorLogo-png.png",
                  alt: "Visit Central Florida"
                }
              )
            }
          ) }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 text-right", children: /* @__PURE__ */ jsx("a", { href: "/about", className: "text-gray-400 hover:text-blue-500", children: "About this site" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
const HeadingToTextSizeMapping = {
  1: "text-xl",
  2: "text-lg",
  3: "text-md",
  4: "text-sm",
  5: "text-sm",
  6: "text-sm"
};
function convertMarkdownLinksToAnchors(text) {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  return text.replace(markdownLinkRegex, (match, linkText, url) => {
    return `<a href="${url}" class="underline hover:text-blue-600" target="_blank">${linkText}</a>`;
  });
}
function findListItems(src) {
  var _a, _b;
  const listItemRegex = /^((\s|\n)+)?(\-|\*(?!\*)|\d+\.)(\s+)?(.+)/;
  const items = [];
  const lines = src.split("\n");
  for (const line of lines) {
    const match = line.match(listItemRegex);
    if (match) {
      items.push({
        indent: ((_a = match[1]) == null ? void 0 : _a.length) ?? 0,
        marker: match[2],
        text: ((_b = match[5]) == null ? void 0 : _b.trim()) ?? "",
        isListItem: true,
        src: line
      });
    } else {
      items.push({
        indent: 0,
        marker: "",
        text: line,
        isListItem: false,
        src: line
      });
    }
  }
  return items;
}
function markdownListToHtml(src) {
  const items = findListItems(src);
  if (items.length === 0) return src;
  const buildList = (currentIndent, startIndex) => {
    let html2 = "";
    let i = startIndex;
    let inList = false;
    let currentListTag = "";
    const closeCurrentList = () => {
      if (inList) {
        html2 += `</${currentListTag}>`;
        inList = false;
      }
    };
    const startNewList = (marker) => {
      const isOrdered = /[0-9]+\./.test(marker);
      currentListTag = isOrdered ? "ol" : "ul";
      const listClass = isOrdered ? "list-decimal" : "list-disc";
      html2 += `<${currentListTag} class="${listClass} list-inside">`;
      inList = true;
    };
    const processListItem = (item) => {
      if (!inList) {
        startNewList(item.marker);
      }
      html2 += `<li>${convertMarkdownLinksToAnchors(item.text)}`;
      if (i + 1 < items.length && items[i + 1].indent > currentIndent) {
        const [subList, newIndex] = buildList(items[i + 1].indent, i + 1);
        html2 += subList;
        i = newIndex;
      }
      html2 += "</li>";
    };
    while (i < items.length) {
      const item = items[i];
      if (item.indent < currentIndent) break;
      if (item.isListItem) {
        if (item.indent > currentIndent) {
          const [subList, newIndex] = buildList(item.indent, i);
          html2 += subList;
          i = newIndex;
        } else {
          processListItem(item);
        }
      } else {
        closeCurrentList();
        html2 += item.src;
      }
      i++;
    }
    closeCurrentList();
    return [html2, i - 1];
  };
  const [html] = buildList(items[0].indent, 0);
  return html;
}
function Markdown({ markdown }) {
  const renderer = new marked.Renderer();
  renderer.heading = (value) => {
    return `<h${value.depth} class="${HeadingToTextSizeMapping[value.depth]} font-bold mb-2">${value.text}</h${value.depth}>`;
  };
  renderer.link = ({ href, title, text }) => {
    return `<a href="${href}" class="text-gray-500 underline hover:text-blue-600">${text}</a>`;
  };
  renderer.list = (value) => {
    if (value.ordered) {
      return `<ol class="list-decimal list-inside mb-4">${value.items.map((t) => `<li>${convertMarkdownLinksToAnchors(markdownListToHtml(t.text))}</li>`).join("\n")}</ol>`;
    }
    return `<ul class="list-disc list-inside mb-4">${value.items.map((t) => {
      return `<li>${convertMarkdownLinksToAnchors(markdownListToHtml(t.text))}</li>`;
    }).join("\n")}</ul>`;
  };
  renderer.paragraph = (value) => {
    const text = renderer.parser.parseInline(value.tokens);
    return `<p class="[&:not(:last-child)]:mb-4">${text}</p>`;
  };
  const rendered = marked(markdown, { renderer });
  return /* @__PURE__ */ jsx("div", { dangerouslySetInnerHTML: { __html: rendered } });
}
const Newsletter2024Aug21 = "# Introducing the all new Florida First Tech Challenge website!\n\n_August 21st, 2024_\n\nWelcome! As you can probably see, some things have changed around here. This is the all new Florida _First Tech Challenge™_ website - if you're not familiar with FTC, you might want to check out this [page](https://www.firstinspires.org/robotics/ftc/what-is-first-tech-challenge).\n\nIf you're looking for event info or registration, head on over to the [Events](/#events) page! If you're a coach curious to know if your team is event ready, check out the [Teams](/#teams) page.\n\nThanks, and have a great season!\n\n_– Jeremy School_\n";
const Newsletter2024Sep11 = "# Florida FTC 2024-25 Newsletter #4\n\n_September 4th, 2024_\n\nGreetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:\n\nOnly four more days until we DIVE℠ INTO THE DEEP℠ presented by RTX. Given the number of changes being implemented this season, I encourage all teams to attend either one of the local, in-person kick-off events or the Florida virtual kick-off event on the FIRST in Florida YouTube channel (https://youtube.com/live/CH24ZmS9GWM). This is the year of change and the year of robot design. Tune in to the kick-off event at 11:15am EDT to learn more.\n\nThe following are the topics covered in this Florida FTC newsletter:\n\n1. Florida FTC Remote Kick-off – September 7, 2024 at 11:15pm EDT (Repeat)\n2. League In-Person Kick-off Events (Repeat)\n3. Studica Robotics Team Sponsorship Opportunity\n4. Field Perimeter and Matts Available\n\n## Newsletter Details\n\n**Florida FTC Remote Kick-off – September 7, 2024 at 11:15pm EDT (Repeat)** – The Florida FTC season kick-off plans include combining our traditional online state-wide program with several local league hosted events. Stay tuned for more information in the coming weeks. The best news is that we are building a kick-off agenda that will allow 5 different activities that will include interactions with teams at each of our in-person league kick-off events. As we finalize the details of our agenda, I will send out another newsletter update in the next couple of weeks with all of the help we need from our Florida teams detailing all of the help we will need.The agenda for the state-wide online kick-off event include the Bob & Sid show and a unique AJ Tech Corner session back by popular demand. The Florida FTC 2024-25 season will officially be started with a kick-off event hosted on the FIRST in Florida YouTube channel (https://youtube.com/live/CH24ZmS9GWM). During the kick-off event, we will provide an update on the season plans as well as perform a walk-through of the INTO THE DEEP℠ game elements and rules.\n\n**League In-Person Kick-off Events** – I have great news about everyone’s ability to attend an in-person kick-off event. Every Florida League will have the opportunity to attend an in-person event, and all of the in-person events will play the Florida and FIRST online virtual event. Most importantly, teams will have an opportunity to participate in the Florida Kick-off event. We will be looking for some help with introducing each in-person kick-off event, answering robot rule questions, guessing the INTO THE DEEP℠ game element, and ask Bob & Sid any game specific rule questions. The following are the list of in-person event locations and the start time of each location:\n\n- AeroCoast League (doors open at 8:00am CDT) – The Doolittle Institute, 1140 John Sims Parkway, Suite 1, Niceville, FL 32569\n- F.U.N. League (doors open at 10:15am EDT) -- American Heritage Delray, 6200 Linton Blvd, Delray Beach, FL 33484\n- Gulf Coast League (doors open at 9:00am EDT) – Seminole High School, 8401 131th Street, Seminole, FL 33776\n- North East Florida League (doors open at 10:15am EDT) – Bolles Bartram Campus, Parker Auditorium, 2264 Bartram Rd, Jacksonville, FL 32207\n- Orlando Robotics and Space Coast Leagues (doors open at 10:20am EDT) – Trinity Preparatory School, 5700 Trinity Prep Lane, Winter Park, FL 32792\n- ROBOT League (doors open at 10:15am EDT) – AMRoC FabLab, 2154 University Square Mall, Tampa, FL 33612\n- South Florida League (doors open at 10:15am EDT) --- Motorola Solutions Plantation, 8000 W. Sunrise Blvd., Plantation, FL 33322\n\n**Studica Robotics Team Sponsorship Opportunity** – If you have reviewed the July 31, 2024 release of the Competition Manual, you will have seen a new robot parts vendor that has been approved by FIRST. Studica Robotics ( www.studica.com )is selling structural, motion, and electronics components that can be used to build FIRST Tech Challenge robots. Studica Robotics will be awarding a $200 team grant each month during the season and you can apply for this grant by going to the following web page: https://www.studica.com/studica-robotics-grant-application\n\n**Field Perimeter and Matts Available** – I am giving away (first come first serve) one set of used field matts and two IFI field perimeters to any team that is within a one-hour drive of the northern Tampa area. The IFI field perimeters are the older and heavier field perimeters that can still be used by teams and competitions. I am willing to meet you within a one-hour drive from my house and would like to give the two fields to two different teams. Please reply to this email and let me know where you are located so that we can determine a shared meeting location so that I can give you the field perimeter and/or used field matts.\n\n_– Hans Wolf_\n";
const Newsletter2024Sep21 = "# Florida FTC 2024-25 Newsletter #5\n\n_September 21st, 2024_\n\nGreetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:\n\nThe Florida FTC season theme this year is Robot Design. Therefore, this newsletter will cover several technical topics including some pointers to videos that can be helpful in robot design. My first design recommendation is to encourage teams to look at game element collectors from the Freight Frenzy and Rover Ruckus seasons. Both of these games included the yellow waffle block game element. The following YouTube video is an example of what you might see: (https://www.youtube.com/watch?v=TdaD5qsfuZ8). The other thing that is great about this video is that there are several examples of the team explaining how specific game rules influenced their robot design.\n\nThe following are the topics covered in this Florida FTC newsletter:\n\n1.                             New Florida FIRST Tech Challenge Website (www.flfirst.org)\n\n2.                             AJ’s Tech Corner\n\n3.                             SDK 10.1 Released: Use REV Hardware Client to Update\n\n4.                             Robot Design Ideas\n\n## Newsletter Details\n\n**New Florida FIRST Tech Challenge Website (www.flfirst.org)** – Some of you might have already noticed that a new Florida FIRST Tech Challenge website was release late on Tuesday evening, September 17. Our plan is that we will incrementally add more features and make it easier to use. The first two features that have been included are a new event registration process and a feature for coaches to determine what needs to be updated in the FIRST Dashboard to ensure that your team is “Event Ready”.\n\nTeams can now start registering to attend events within your league by going to the “Event” page on the www.flfirst.org website. The big change is that you will no longer need the 5-digit team code, and you will now create an account using the same email address that you use to login to your FIRST Dashboard. Find your league and the event by scrolling down on the events web page and then select the “Register” button. If the “Register” button is grayed out it means that the registration window for that event is currently not open. You will first be asked to create an account on a system called Region Manager (the following is short video that explains the event registration process: https://youtu.be/AoQfTYcof1Q) .\n\nThe second new feature is that you can now validate if your team is “Event Ready”. FIRST requires that each team must have two coaches, both coaches must have signed the online Consent & Release form, and both coaches must have an active YPP background screening. You can determine if your team is event ready by going to the “Teams” page and locating your team number. If you see a “Yes” in the bottom right corner of your team’s information box on the screen, no further action is needed. If you see a “No” you can select the “Coaches get ready now” link to be taken to Region Manager to determine what actions are required to enable your team to be approved by FIRST to attend an event.\n\nA big and loud THANK YOU to [AJ Foster](https://aj-foster.com/) and [Jeremy School](https://jeremy.school) for all of the extra time in the last several months helping re-engineer our website and to Kyle Hoyt for his continued guidance on this journey.\n\n**AJ’s Tech Corner** – AJ’s Tech Corner is now world famous as FIRST has started to promote his videos to help teams. I encourage all Florida FTC teams to visit the following YouTube channel to see the latest tech advance for our Florida lead FTA AJ Foster: https://youtube.com/@ftaaj. AJ has some great videos that include advice on field setup, reviews of some of the robot design ideas seen in Robot in 30 Hours (Ri30H) videos, and a detailed review of the Competition Manual changes.\n\n**DK 10.1 Released: Use REV Hardware Client to Update** – Last week you should have received a FIRST Tech Challenge Team Blast included an announcement that the FTC SDK would be released on September 20, 2024. I encourage teams to update to the latest SDK so that you can test and practice with this software well in advance of your first league meet. The SDK can be updated through the REV Hardware Client when your Driver Hub is connected to your computer. You will just need to press the “Update All” button in the upper right corner of the screen. The final step is to connect to the Robot controller and update the software. The final recommendation is to make sure that you also update your backup devices.\n\n**Robot Design Ideas** – FTC teams are encouraged to learn from other teams and past games. In this newsletter introductory paragraph, I referenced a video from the Freight Frenzy season that can provide some insight to your game element collector design. Another great source of design ideas is the Ri30H videos available on YouTube and some videos from the FTC parts/kit providers. The following are a few additional videos that your team can review for design ideas:\n\nREV Robotics has created a basic robot for the INTO THE DEEP game challenge that can be build from their starter kit: [https://www.revrobotics.com/duo/ftc-starter-bot/?mc_cid=ff0f386b72&mc_eid=2d47985a2d](https://www.revrobotics.com/duo/ftc-starter-bot/?mc_cid=ff0f386b72&mc_eid=2d47985a2d)\n\nGobilda has also created a starter bot that can be build from their starter kit: [https://www.gobilda.com/ftc-starter-kit-2024-2025-season/?srsltid=AfmBOooTRq70wzGgLff4X3N8koZfo8RSYqzN-C9oG81avIc4XtAwrZ04](https://www.gobilda.com/ftc-starter-kit-2024-2025-season/?srsltid=AfmBOooTRq70wzGgLff4X3N8koZfo8RSYqzN-C9oG81avIc4XtAwrZ04)\n\nThe following are a few video links to some of the Ri30H videos:\n\n- https://www.youtube.com/watch?v=_JU4qY0d6T0\n- https://www.youtube.com/watch?v=wACaSMCjWXo\n- https://www.youtube.com/playlist?list=PLkZ6_Ld1x9Y9gDrQusVzXpB_OPDQigr7e\n\n_– Hans Wolf_\n";
const Newsletter2024Oct17 = `# Florida FTC 2024-25 Newsletter #6

_October 17th, 2024_

Greetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:

It has been a challenging few weeks for many Florida FTC teams impacted by hurricanes Helene and Milton. I hope everyone is safe and recovering well. I apologize for the delay in sending out this newsletter, as I was without power and internet due to the storm. (On a lighter note, my daughter’s family found a lost cat after the hurricane and named him Milton!)

The following are the topics covered in this Florida FTC newsletter:

1. How to Find League Meet Dates/Locations
2. New Florida FIRST Tech Challenge Website (Repeat)
3. SDK 10.1 Released: Use REV Hardware Client to Update
4. Robot Design Ideas
5. Florida Championship T-shirt Design Contest
6. Dean's List Student Nomination

## Newsletter Details

**How to Find League Meet Dates/Locations** – All league event dates and locations are now published on the [Florida FIRST Tech Challenge website](http://www.flfirst.org). To find your league event information, select the "Events" page at the top right of the website. Statewide events are listed at the top, followed by league-specific events. Event details include address, registration window dates, and the number of teams registered. If registration is open, the "Register" button will be blue. Feel free to provide feedback on this new website by replying to this email.

**New Florida FIRST Tech Challenge Website (Repeat)** – A new Florida FIRST Tech Challenge website was launched on September 17. We plan to incrementally add features to enhance usability. Two initial features are:

- **Event Registration**: Teams can register for events without the previous 5-digit team code. Coaches #1 and #2 can use the same email as their FIRST Dashboard login to create an account on Region Manager and register. [Watch this video for more on the registration process](https://youtu.be/AoQfTYcof1Q).
- **Event Readiness Check**: Ensure your team is "Event Ready" by verifying that both coaches have signed the online Consent & Release form and completed the YPP background screening. Check the "Teams" page for your team’s status. A "Yes" in the bottom right indicates readiness, while "No" provides a link to complete requirements.

A big THANK YOU to AJ Foster, Jeremy School, and Kyle Hoyt for their hard work on this project.

**SDK 10.1 Released: Use REV Hardware Client to Update** – The FTC SDK was released on September 20, 2024. Teams should update to SDK 10.1 using the REV Hardware Client. Simply connect your Driver Hub, click "Update All," and then update the Robot Controller software. Remember to update backup devices as well for smooth operation.

**Robot Design Ideas** – Teams are encouraged to explore robot design ideas by reviewing videos from past seasons and other resources. Some recommended videos include:

- **REV Robotics Starter Bot for INTO THE DEEP**: [REV Starter Bot](https://www.revrobotics.com/duo/ftc-starter-bot/?mc_cid=ff0f386b72&mc_eid=2d47985a2d)
- **Gobilda Starter Bot**: [Gobilda Starter Bot](https://www.gobilda.com/ftc-starter-kit-2024-2025-season/?srsltid=AfmBOooTRq70wzGgLff4X3N8koZfo8RSYqzN-C9oG81avIc4XtAwrZ04)
- **Ri30H Videos**:
  - [Video 1](https://www.youtube.com/watch?v=_JU4qY0d6T0)
  - [Video 2](https://www.youtube.com/watch?v=wACaSMCjWXo)
  - [Full Playlist](https://www.youtube.com/playlist?list=PLkZ6_Ld1x9Y9gDrQusVzXpB_OPDQigr7e)

**Florida Championship T-shirt Design Contest** – The volunteer T-shirt contest is back! Submit your design by November 30, 2024, for a chance to receive a guaranteed invitation to the Florida Championship from February 28 to March 1, 2025. Contest requirements:

- Email your design to hanskwolf@gmail.com by midnight on November 30, 2024.
- Submit a high-resolution JPG, single-color logo design.
- Include "Florida Championship 2025" and the INTO THE DEEPSM logo.
  The winner will earn an automatic invitation to the championship, or a $200 credit if they qualify through their league.

**Dean's List Student Nomination** – The deadline for Dean's List nominations is December 15, 2024. Coaches can submit nomination essays through the FIRST Dashboard. Each team may nominate up to two 10th or 11th grade students who embody FIRST program values. Nominees will be interviewed at each league tournament, and four finalists will be announced at the Florida Championship on March 1, 2025. The World Championship in April 2025 will select ten winners from among these finalists. Learn more in [Chapter 10 of the Game Manual Part 1](https://www.firstinspires.org/Robotics/ftc/deans-list).

I encourage all coaches to visit the Dean's List page to learn about last year’s Florida winner, Ramsey McClure.

_– Hans Wolf_
`;
const Newsletter2024Oct31 = '# Florida FTC 2024-25 Newsletter #7\n\n_October 31st, 2024_\n\nGreetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:\n\nWe’ve kicked off the season with our first League Meets! The AeroCoast and North East Florida leagues led the way, completing their first events on October 19th. As we head into a busy schedule with nine League Meets in November and eight in early December, this newsletter provides tips to help coaches and teams prepare for these upcoming events. In December and January, I’ll share more insights on preparing for League Tournaments and the Florida Championship.\n\nThe following topics are covered in this Florida FTC newsletter:\n\n1. Tip: Preparing for League Meets – Inspection\n2. Servo and Motor ROBOT Rules\n3. Definition of “Event Ready” (Repeat)\n4. How to Register to Attend League Events (Repeat)\n\n## Newsletter Details\n\n**Tip: Preparing for League Meets – Inspection** – With the busy INTO THE DEEP season ahead, it’s essential to prepare for Robot and Field inspections. The first step at any League Meet is inspection, so I encourage all teams to review the Competition Manual, especially:\n\n- Section 3.3: MATCH Eligibility Rules\n- Chapter 12: ROBOT Construction Rules\n\n**Recommended Best Practices**:\n\n- Self-Inspection: A week before your event, conduct a self-inspection using the Inspection Checklist, which you can find in the "Season Materials" section under "Additional Materials" on the [FIRST webpage](https://www.firstinspires.org/robotics/ftc).\n- Use the Self-Inspect Feature: The Driver Station includes a “Self Inspect” feature (accessible from the main menu in the upper right corner). Review the checklist for both the Driver Station and Control Hub, ensuring everything is highlighted green. Any red Xs indicate issues to address before attending an event. Additional self-inspect info can be found on [GitHub](https://github.com/FIRST-Tech-Challenge/FtcRobotController/wiki/FTC-Self-Inspect).\n\nPlease verify that your team is using SDK version 10.1.\n\n**Servo and Motor ROBOT Rules** – Chapter 12 of the Competition Manual defines rules for legal motors and servos. **Rule R501** provides a list of allowable motors. Ensure your team’s motors comply with this list, primarily from FTC-approved vendors such as AndyMark, goBILDA, REV Robotics, Studica, and TETRIX.\n\nFor servos, **Rule R502** specifies power limits:\n\n- <= 8 watts @6V\n- <= 4 amps @6V\n\nTeams can pass inspection by confirming their servos are on the list in Rule R502. If your servos are not listed, you’ll need to verify they meet the power requirements. Use the [servo power calculator on the FTC website](https://ftc-docs.firstinspires.org/en/latest/tech_tips/tech-tips.html#powercalculator) to confirm compliance.\n\n**Definition of “Event Ready” (Repeat)** – Some coaches have noticed they are unable to register for League Meets due to the “Event Ready” requirement. Being “Event Ready” is mandatory, defined by FIRST, and involves:\n\n1. Completing the FIRST registration process, including the $295 season fee.\n2. Registering two coaches for the team through the FIRST Dashboard.\n3. Ensuring both coaches sign the FIRST consent and release form.\n4. Completing and passing the FIRST YPP screening for both coaches.\n5. Ensuring each student team member signs the FIRST consent and release form, ideally through their FIRST Dashboard.\n\nCurrently, 10 Florida teams are not “Event Ready.” Coaches can confirm readiness by visiting the [Teams page on the FLFIRST website](http://www.flfirst.org/index.php/season/teams?view=teams). A “0” in the “Ready” column means the team is not ready for registration. Click “Coaches, get ready now” for guidance on completing requirements.\n\n**How to Register to Attend League Meets (Repeat)** – Dates and locations for League Meets and most League Tournaments are now available on the [FLFIRST website](http://www.flfirst.org). To find your event:\n\n- Navigate to the "Events" page: Florida-wide events are at the top, followed by league-specific events organized by date.\n- Important Details: Each event listing includes address, registration dates, and the number of registered teams.\n- Registration: Coaches #1 and #2 should create an account using the email associated with their FIRST Dashboard login. Scroll to find your league and event, then click “Register.” If the “Register” button is gray, the registration window is not yet open. You will need to create an account on Region Manager. [This video](https://youtu.be/AoQfTYcof1Q) explains the registration process.\n\n_– Hans Wolf_\n';
const Newsletter2024Nov10 = '# Florida FTC 2024-25 Newsletter #8\n\n_November 10, 2024_\n\nGreetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:\n\nWe have now completed 8 League Meets but still have 19 more to go. The league season will wrap up with 8 League Tournaments. A reminder to all teams: once you pay your league registration fee, your team can attend all League Meets and participate in your League Tournament. Please review the items below, as I have an important update about this season’s Florida Championship event.\n\nThe following are the topics covered in this Florida FTC newsletter:\n\n1. Florida Championship Update\n2. League Meet Results Published on FIRST Website\n3. Team Number Template Available (Rules R401, R402, & R403)\n4. How to Register to Attend League Events (Repeat)\n\n## Newsletter Details\n\n**Florida Championship Update** – The Florida FIRST Tech Challenge Championship will be held on February 28, 2025, and March 1, 2025, at the AdventHealth FieldHouse in Winter Haven, FL. Exciting news this season: we will run 8 qualification matches per team instead of 6. As a result, qualification matches will begin Friday afternoon, and the inspection process will start earlier on Friday.\n\nVolunteers: The Florida Championship event is now in the FIRST Volunteer Management System (VMS), and we will need volunteers available Friday afternoon to start running qualification matches. The current plan is to run 14 matches on Friday.\n\n**League Meet Results Published on FIRST Website** – Teams can access the results of all events within the United States. Event details are available on the FIRST webpage: [https://ftc-events.firstinspires.org/2024](https://ftc-events.firstinspires.org/2024). To find Florida league event results, select "Florida" from the region menu in the center of the page and press the “Update List” button. Events are organized by date.\n\n**Team Number Template Available (Rules R401, R402, & R403)** – Teams and Coaches, please review the updated team number rules (R401, R402, & R403). Teams are no longer required to use Alliance Markers and must now have two sets of team numbers: two with a red background and two with a blue background. FIRST has published a “Robot Sign Template” on the Season Materials web page, but it requires teams to use red and blue markers to color in their numbers. To assist, I’ve created a Microsoft Word document template that you can use if your team has access to a color printer. Reply to this email if you’d like a copy of the team number template.\n\n**How to Register to Attend League Events (Repeat)** – All League Meet and most League Tournament dates and locations are published on the [www.flfirst.org](http://www.flfirst.org) website. To find your league event information, select the “Events” page near the top-right side of the page. Florida-wide events are listed at the top of the page, followed by events organized by League name and date. Event details include the address, the registration window, and the number of teams registered.\n\nTo register, Team Coach #1 and #2 must create an account using the same email address linked to their FIRST Dashboard. Locate your league and event by scrolling down the Events page, then select the “Register” button. If the button is grayed out, the registration window is not yet open. You’ll be prompted to create an account in the Region Manager system. For assistance, watch this short video explaining the event registration process: [https://youtu.be/AoQfTYcof1Q](https://youtu.be/AoQfTYcof1Q).\n\n_– Hans Wolf_\n';
const Newsletter2024Nov14 = "# Florida FTC 2024-25 Newsletter #9\n\n_November 14, 2024_\n\nGreetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:\n\nThe primary purpose of this newsletter is to help you understand the league ranking approach and prepare for several important upcoming deadlines.\n\nThe following are the topics covered in this Florida FTC newsletter:\n\n1. Dean’s List Student Nominations\n2. Florida Championship Volunteer T-shirt Design Contest\n3. Florida Championship Advancement Criteria\n4. Understanding League Ranking\n\n## Newsletter Details\n\n**Dean’s List Student Nominations** – The deadline for submitting Dean’s List nominations is **December 15, 2024**. Coaches can submit nomination essays through the FIRST dashboard. All Florida league nominations will be submitted to a single “Interview Only” event called the “Florida Dean’s List Interview.” Coaches should select this event when submitting Dean’s List nominations.\n\nEach team can submit up to two (2) nominations for students in 10th or 11th grade who best represent FIRST program values. Nominated students will be interviewed during league tournaments to provide input for selecting the four (4) Florida Dean’s List Finalists, announced on March 1, 2025, at the Florida Championship. These finalists will compete for one of ten (10) Dean’s List Winner titles at the World Championship in April 2025.\n\nFor more details, review Section 6.4.1 Dean’s List Award in the Competition Manual or visit [FIRST Tech Challenge Dean's List](https://www.firstinspires.org).\n\n**Florida Championship Volunteer T-shirt Design Contest** – The Florida Championship Volunteer T-shirt Design Contest is back! This is your chance to secure a guaranteed invitation to the Florida Championship on **February 28 and March 1, 2025**.\n\nDesign submissions are due by **December 20, 2024** and must meet the following requirements:\n\n- Submit the design as a high-resolution JPG file to hans.wolf@verizon.net.\n- The file must be single-color.\n- Include the text: “Florida Championship 2025.”\n- Incorporate the official _INTO THE DEEP℠ presented by Raytheon Technologies_ game logo.\n\nThe winner will receive an automatic invitation to the Florida Championship. If the team also qualifies through league advancement, they will receive a $200 credit toward the registration fee.\n\n**Florida Championship Advancement Criteria** – In early December 2024, the number of teams advancing from each League Tournament to the Florida Championship will be announced. This approach mirrors how FIRST allocates advancement slots for the World Championship.\n\n- All leagues will have a minimum of 2 advancement slots.\n- Larger leagues will receive more slots based on relative league size.\n- Last season, Florida leagues received between 4 and 11 advancement slots.\n\nAdvancement is determined by Judge awards or robot alliance performance. Review Chapter 4.0 Advancement in the Competition Manual for details, as there are changes from previous seasons. Notably, there are only two-team alliances in Playoff rounds, with the Winning Alliance Captain and Partner advancing in positions #2 and #3, followed by the 2nd Place Inspire Award team.\n\n**Understanding League Ranking** – Attending as many League Meets as possible helps your team improve its league ranking going into the League Tournament.\n\nLeague ranking is based on:\n\n- Ranking Score (RS)\n- Average Alliance Auto Points\n- Average TeleOp Alliance Ascend Points\n\nThe scoring software selects a team’s best 10 matches to calculate rankings. For example, if your team participates in 3 League Meets with 6 matches each (18 matches total), the software will use the top 10 matches with the highest scores.\n\nRanking Score (RS) is the average of a team’s Ranking Points (RP), where:\n\n- Win = 2 RP\n- Tie = 1 RP\n- Loss = 0 RP\n\nFor details, review Section 13.5 Qualification Matches in the Competition Manual.\n\n_– Hans Wolf_\n";
const Newsletter2024Nov24 = `# Florida FTC 2024-25 Newsletter #10

_November 24, 2024_

Greetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:

The primary purpose of this newsletter is to highlight several important deadline dates.

The following are the topics covered in this Florida FTC newsletter:

1. Florida Championship Volunteer T-shirt Design Contest (Correction)
2. Dean’s List Student Nominations (Repeat)
3. Florida Championship Lottery

## Newsletter Details

**Florida Championship Volunteer T-shirt Design Contest (Correction)** – This is your opportunity to secure a guaranteed invitation to the Florida Championship on **February 28 and March 1, 2025**. All Florida FTC teams are eligible to submit a volunteer t-shirt design by **December 20, 2024**, and the winner will be announced on **January 12, 2025**.

Design requirements:

- Email design files to hanskwolf@gmail.com or hans.wolf@verizon.net by **midnight December 20, 2024**.
- Submit the design as a high-resolution JPG file.
- The design must be single color.
- Include the text: “Florida Championship 2025.”
- Incorporate the official _INTO THE DEEP℠ presented by Raytheon Technologies_ game logo.

The winner will receive an automatic invitation to the Florida Championship. If the team also qualifies through league advancement, they will receive a $200 credit toward the registration fee.

**Dean’s List Student Nominations (Repeat)** – The deadline for submitting Dean’s List nominations is **December 15, 2024**. Coaches can submit nomination essays through the FIRST dashboard. All nominations across Florida leagues will be submitted to a single “Interview Only” event called the “Florida Dean’s List Interview.” Coaches must select this event when submitting nominations.

Each team may submit up to two (2) nominations for 10th or 11th grade team members who best represent FIRST program values. Nominated students will be interviewed during league tournaments to provide input for selecting four (4) Florida Dean’s List Finalists, who will be announced on **March 1, 2025**, at the Florida Championship. These finalists will compete for one of ten (10) Dean’s List Winner titles at the World Championship in April 2025.

For more details, review Section 6.4.1 Dean’s List Award in the Competition Manual or visit [FIRST Tech Challenge Dean's List](https://www.firstinspires.org).

**Florida Championship Lottery** – The Florida Championship lottery is back! This year, **56 teams** will receive invitations to participate in the Florida Championship:

- 54 teams will advance through league tournaments.
- One team will qualify by winning the volunteer t-shirt design contest.
- One additional team will be selected through the lottery.

The lottery is an excellent opportunity for teams that have not recently attended the Florida Championship. To enter, the head coach must email hanskwolf@gmail.com with the following subject line:  
**“Florida Championship Lottery: Team #xxxxx”** (replace "xxxxx" with your FTC team number).

Lottery entry emails must be received by **January 10, 2025**.

Reminder: Teams invited to the Florida Championship are required to pay a $200 event registration fee and must arrive at the venue by **11:00 am on Friday, February 28, 2025**, to complete the robot inspection process and begin alliance matches.

_– Hans Wolf_
`;
const Newsletter2024Dec10 = "# Florida FTC 2024-25 Newsletter #11\n\n_December 10, 2024_\n\nGreetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:\n\nThe primary purpose of this newsletter is to provide a final reminder about the Dean’s List nomination deadline, highlight a few important rule changes implemented this season, and encourage all participants to review the Team Updates to the Competition Manual.\n\nThe following are the topics covered in this Florida FTC newsletter:\n\n1. Dean’s List Student Nominations (Repeat)\n2. Key Rule Change Reminder\n3. Competition Manual Team Updates\n\n## Newsletter Details\n\n**Dean’s List Student Nominations (Repeat)** – The deadline for submitting Dean’s List nominations is **December 15, 2024**. Coaches can submit nomination essays through their FIRST dashboard. All Florida league nominations will be submitted to a single “Interview Only” event called the “Florida Dean’s List Interview.” Coaches must select this event when submitting nominations.\n\nEach team may submit up to two (2) nominations for 10th or 11th grade team members who best represent FIRST program values. Nominated students will be interviewed during league tournaments to provide input for selecting the four (4) Florida Dean’s List Finalists, who will be announced on **March 1, 2025**, at the Florida Championship. These finalists will compete for one of ten (10) Dean’s List Winner titles at the World Championship in April 2025.\n\nFor more details, review Section 6.4.1 Dean’s List Award in the Competition Manual or visit [FIRST Tech Challenge Dean's List](https://www.firstinspires.org).\n\n**Key Rule Change Reminder** – During the Florida FTC Season Kick-off, we highlighted several rule changes for the _INTO THE DEEP℠ presented by RTX_ season. Below are reminders of a few key changes:\n\n- Team Numbers (R401, R402, & R403):\n\n  - Teams no longer need Alliance Markers.\n  - Teams must have two red-background and two blue-background team numbers in white.\n  - A Microsoft Word template is available for teams with access to a color printer. Email hans.wolf@verizon.net to request the template.\n\n- Servos (R502):\n\n  - Mechanical output power for servos must be less than 8 watts and stall current below 4 amps.\n  - A validated servo list is available in the _Inspection Quick Reference_ document on the [FIRST webpage](https://www.firstinspires.org/resource-library/ftc/volunteer-resources).\n\n- Horizontal Expansion Rule (R104 & G418):\n  - Robots may not expand beyond a 20x42 inch area after the match starts.\n  - Violations occur if the robot swings outside the 20-inch limit during Level 2 ASCEND or tips over during a match.\n\n**Competition Manual Team Updates** – FIRST has published six Team Updates, which often include Competition Manual changes. These updates can be found on the [FIRST Game and Season Info page](https://www.firstinspires.org/resource-library/ftc/game-and-season-info). Below are highlights from recent updates:\n\n- Human Players (G431):\n\n  - Human Players may only place SCORING ELEMENTS in the OBSERVATION ZONE during AUTO and TELEOP periods.\n  - Robots and Human Players may not simultaneously control or contact a SCORING ELEMENT.\n\n- Horizontal Expansion (R104 & G418):\n\n  - Horizontal size boundaries must remain coplanar to the TILE floor.\n  - Team Update #05 removed the requirement for referees to request a re-inspection for violations.\n\n- Robot Scoring Criteria (ASCEND):\n  - Robots may stabilize on the SUBMERSIBLE during ASCEND but must not touch it at match end.\n  - Robot chassis may swing into the SUBMERSIBLE ZONE during ASCEND.\n\n**Important Reminder**: Review all Team Updates published by FIRST before attending your next event.\n\n_– Hans Wolf_\n";
const Newsletter2025Jan6 = "# Florida FTC 2024-25 Newsletter #12\n\n_January 6th, 2025_\n\nGreetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:\n\nHappy New Year and welcome to the final four weeks of the Florida FIRST Tech Challenge league 2024-25 season. The Florida Into the Deep season will wrap-up with the Florida Championship that will be held on February 28 and March 1, 2025. Fifty-six (56) teams will be invited to the Florida Championship through the Advancement process at each of our eight (8) League Tournaments. All teams within a league are eligible to attend your League Tournament.\n\nThe League Tournaments operate differently from the League Meets you have attended and there are also several changes this season to the League Tournament. The League Tournament is the final celebration of the accomplishments of all of the Florida teams and has five additional activities:\n\n- Dean’s List student nomination will participate in an interview (interview only, no award),\n- Alliance selection and play-off matches will be run immediately following the qualification matches, and\n- Teams will participate in judge interviews and the FIRST judge award will be presented at the end of the day,\n- Awards ceremony that includes both robot and judge awards, and\n- The final activity of the League Tournaments will be to announce the teams that will be attending the Florida Championship.\n\nThe following are the topics covered in this Florida FTC newsletter to help team’s prepare for your League Tournament:\n\n1. Judge Interview Process for League Tournaments\n\n2. Alliance Selection and Playoff Matches\n\n3. Teams Receiving Bids to the Florida Championship\n\n## Newsletter Details\n\n**Judge Interview Process for League Tournaments** – Chapter 6.0 of the Competition Manual describes the judging process and the seven required judge awards and the two optional judge awards. A key part of the judging process is that each team has the opportunity to participate in a judge interview and can submit one document to be reviewed by the judges: (1) Engineering Portfolio. This is a change from prior seasons as the Control Award form is no longer needed as it has been incorporated into the Engineering Portfolio and a Portfolio is no longer required for several of the awards. Many of the Florida leagues will be following a hybrid style league tournament which means that the 10-minute judge interview will be conducted online prior to the day of the League Tournament robot matches. This also means that teams will need to upload your Engineering Portfolio to the Online scoring software platform. Therefore, I encourage all coaches to as soon as possible ensure you are able to login to the Online Scoring Software and are able to access this feature within your league tournament. You can access the scoring software from within your FIRST dashboard or you can go directly to the scoring software by clicking on the following web page link: https://ftc-scoring.firstinspires.org/. Team coaches can user your FIRST dashboard userid and password to login to the scoring software.\n\n**Alliance Selection and Playoff Matches** – Sections 13.6 in the Competition Manual describes the details about the Alliance Selection process and the Playoff Matches. During the Alliance Selection process, the top four or six ranked teams (if the League Tournament has 21 or more teams, there will be 6 Alliances) become alliance captains and will ask one team to join their alliance. Once the alliance teams are selected, a double elimination bracket structure will be followed to determine the Winning Alliance.\n\n**Teams Receiving Bids to the Florida Championship** – The last thing that will happen at your League Tournaments is the announcement of teams that will advance to the Florida Championship on February 28 and March 1, 2025 at the Advent Fieldhouse in Winter Haven, FL. The teams advancing to the Florida Championship are selected based on the Order of Advancement requirements defined in section Chapter 4 of the Competition Manual. I encourage teams and coaches to review this part of the Competition Manual to understand the team advancement process. Below is the number of teams that will be advancing from each of the eight Florida leagues. If your team is selected to attend the Florida Championship, you will receive an email requesting confirmation that you will be attending the championship, and you must respond to that email within 48 hours or your spot will be given to another team. Teams attending the Florida Championship are required to pay a $200 team registration fee to help cover a small part of the cost to host this event and teams must be able to arrive in Winter Haven, FL by 11:00am on Friday, February 28 , 2025 to complete robot and field inspection and participate in the beginning of qualification matches.\n\nFifty-six (56) Florida FTC teams will receive an invitation to the state championship. One (1) team will be selected from the lottery submissions, one (1) team is the winner of the volunteer t-shirt design content, and fifty-four (54) will come from the League Championship Tournaments as follows:\n\n- AeroCoast League – 6 teams\n- Gulf Coast League – 8 teams\n- F.U.N. League – 6 teams\n- Orlando Robotics League – 6 teams\n- North East Florida League – 8 teams\n- ROBOT League – 6 teams\n- South Florida League – 8 teams\n- Space Coast League – 6 teams\n\n_– Hans Wolf_\n";
const Newsletter2025Jan19 = "# Florida FTC 2024-25 Newsletter #13\n\n_January 19th, 2025_\n\nGreetings Florida FTC Teams, Coaches, Volunteers, and Sponsors:\n\nAll league meets have been completed, and the next step for each of the eight (8) Florida leagues is to conduct the League Tournament and determine which teams will advance to the Florida Championship. The AeroCoast and Orlando Robotics League Tournaments will be hosted this weekend (January 25th), while the FUN, Gulf Coast, Northeast Florida, ROBOT, South Florida, and Space Coast League Tournaments will take place on February 1st. Teams should begin preparing for judge interviews and planning for the alliance selection process. Please remember that the League Tournament is a much longer day as it includes the alliance selection process, Play-off Matches, and the Awards Ceremony.\n\nGood luck to all teams! I look forward to seeing 56 Florida teams at the Florida Championship on February 28 and March 1 at the AdventHealth Fieldhouse in Winter Haven, FL.\n\nThe following are the topics covered in this Florida FTC newsletter:\n\n1. Florida Championship T-Shirt Design Contest Winner\n2. Teams Receiving Bids to the Florida Championship (Repeat)\n\n## Newsletter Details\n\n### Florida Championship T-Shirt Design Contest Winner\n\nThe creativity of our Florida FIRST Tech Challenge teams continues to amaze. Selecting the winner of the Florida Championship t-shirt design contest was no easy task, as we received more than 40 fantastic designs. After review by a panel of eight (8) judges, the designs were narrowed down to a short list of four (4). Following significant debate, I am happy to announce that the winner of the t-shirt design contest is Team 27234, the Radical Raiders, from the FIRST United Network (F.U.N.) League. Congratulations to the Radical Raiders!\n\n### Teams Receiving Bids to the Florida Championship (Repeat)\n\nThe final activity at your League Tournaments will be the announcement of teams advancing to the Florida Championship on February 28 and March 1, 2025, at the AdventHealth Fieldhouse in Winter Haven, FL. Advancing teams are selected based on the Order of Advancement requirements defined in Chapter 4 of the Competition Manual. Teams and coaches are encouraged to review this section to understand the advancement process.\n\nIf your team is selected to attend the Florida Championship, you will receive an email requesting confirmation of attendance. You must respond to this email within 48 hours, or your spot will be given to another team. Teams attending the Florida Championship are required to pay a $200 team registration fee to help cover a portion of the event costs. Additionally, teams must arrive in Winter Haven, FL, by 11:00 AM on Friday, February 28, 2025, to complete robot and field inspections and participate in the start of qualification matches.\n\nFifty-six (56) Florida FTC teams will receive invitations to the state championship. The distribution of these invitations is as follows:\n\n- One (1) team selected from lottery submissions\n- One (1) team as the winner of the volunteer t-shirt design contest\n- Fifty-four (54) teams from the League Championship Tournaments:\n  - AeroCoast League – 6 teams\n  - Gulf Coast League – 8 teams\n  - F.U.N. League – 6 teams\n  - Orlando Robotics League – 6 teams\n  - North East Florida League – 8 teams\n  - ROBOT League – 6 teams\n  - South Florida League – 8 teams\n  - Space Coast League – 6 teams\n\n_See you all at the Florida Championship!_\n\n_-- Hans Wolf_\n";
const Newsletter2025Jan19Summary = "## Newsletter #13 Summary\n\n**League Tournaments Schedule**:\n\n- January 25, 2025: AeroCoast and Orlando Robotics League Tournaments.\n- February 1, 2025: FUN, Gulf Coast, Northeast Florida, ROBOT, South Florida, and Space Coast League Tournaments.\n- League Tournaments include judge interviews, alliance selection, Play-off Matches, and Awards Ceremony.\n\n**Florida Championship Details**:\n\n- Date: February 28–March 1, 2025.\n- Location: AdventHealth Fieldhouse, Winter Haven, FL.\n- Arrival: Teams must arrive by 11:00 AM on February 28 for inspections and qualification matches.\n- Registration Fee: $200 per team.\n- Confirmation: Respond to the invitation email within 48 hours to secure your spot.\n\n**T-Shirt Design Contest Winner**:\n\n- Winner: Team 27234, the Radical Raiders, from the F.U.N. League.\n\n**Teams Advancing to the Florida Championship**:\n\n- One (1) team: Lottery winner.\n- One (1) team: T-shirt design contest winner.\n- Fifty-four (54) teams from League Tournaments:\n  - AeroCoast: 6 teams\n  - Gulf Coast: 8 teams\n  - F.U.N.: 6 teams\n  - Orlando Robotics: 6 teams\n  - Northeast Florida: 8 teams\n  - ROBOT: 6 teams\n  - South Florida: 8 teams\n  - Space Coast: 6 teams\n\nGood luck to all teams in the League Tournaments!\n";
const Newsletter2025Jan6Summary = "## Newsletter #12 Summary\n\n**Florida Championship**:\n\n- Date: February 28–March 1, 2025\n- Location: Advent Fieldhouse, Winter Haven, FL\n- 56 teams will qualify via League Tournaments and additional criteria.\n\n**League Tournaments**:\n\n- Dates: Final four weeks of the season (specific dates depend on the league).\n\nActivities include:\n\n- Dean’s List interviews (no award).\n- Alliance selection and playoff matches.\n- Judge interviews and awards.\n- Announcement of teams advancing to the Florida Championship.\n\n**Judge Interviews**:\n\n- 10-minute interviews (hybrid format: online before tournament day).\n- Required document: Engineering Portfolio (Control Award form now integrated).\n- Ensure access to the online scoring software: [ftc-scoring.firstinspires.org](https://ftc-scoring.firstinspires.org/).\n\n**Alliance Selection and Playoff Matches**:\n\n- Top 4 or 6 ranked teams (based on size) become alliance captains.\n- Double elimination bracket determines the winning alliance.\n\n**Advancement to Florida Championship**:\n\n- Respond to the invitation email within 48 hours.\n- Registration fee: $200 per team.\n- Arrival time: By 11:00 AM, February 28, 2025, for inspections and matches.\n\n**Advancing Teams by League**:\n\n- AeroCoast: 6 teams\n- Gulf Coast: 8 teams\n- F.U.N.: 6 teams\n- Orlando Robotics: 6 teams\n- North East Florida: 8 teams\n- ROBOT: 6 teams\n- South Florida: 8 teams\n- Space Coast: 6 teams\n\n**Key Changes**:\n\n- Hybrid judging interviews conducted online.\n- Engineering Portfolio replaces multiple documents for awards.\n- Playoff structure uses double elimination.\n";
const Newsletter2024Dec10Summary = "## Newsletter #11 Summary\n\n**Dean’s List Nominations**:\n\n- Deadline: December 15, 2024.\n- Submit essays via the FIRST dashboard under the “Florida Dean’s List Interview” event.\n- Each team may nominate up to 2 students (10th/11th grade).\n- Interviews held at league tournaments; finalists announced on March 1, 2025.\n- Finalists compete for Dean’s List Winner titles at the World Championship in April 2025.\n\n**Key Rule Changes**:\n\n- Team Numbers:\n  - No Alliance Markers required.\n  - Two red and two blue team numbers with white text needed (template available upon request).\n- Servos:\n  - Output power <8 watts, stall current <4 amps.\n  - Validated servo list in the _Inspection Quick Reference_.\n- Horizontal Expansion:\n  - Robots must stay within a 20x42-inch area after the match begins.\n  - Violations apply if the robot exceeds limits during gameplay.\n\n**Competition Manual Updates**:\n\n- Human Players:\n\n  - May only place SCORING ELEMENTS in the OBSERVATION ZONE during AUTO and TELEOP.\n  - Simultaneous contact by Robots and Human Players is prohibited.\n\n- Horizontal Expansion:\n\n  - Expansion must stay coplanar to the floor.\n  - Re-inspection no longer required for violations.\n\n- ASCEND Scoring:\n\n  - Robots may stabilize on the SUBMERSIBLE but must not touch it at match end.\n\n**Action Items**:\n\n- Review the six published Team Updates before attending events.\n- Updates available on the [FIRST Game and Season Info page](https://www.firstinspires.org/resource-library/ftc/game-and-season-info).\n";
const meta$3 = () => {
  return [
    { title: "Newsletter | Florida FIRST Tech Challenge" },
    { name: "description", content: "Welcome to Remix!" }
  ];
};
const Post = ({ children }) => {
  return /* @__PURE__ */ jsx("div", { className: "bg-white shadow-md p-4 max-w-prose", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4", children }) });
};
const MarkdownPost = ({
  content,
  summary
}) => {
  const [showSummary, setShowSummary] = useState(false);
  return /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
    /* @__PURE__ */ jsx(Post, { children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      summary && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowSummary(!showSummary),
          className: "flex md:hidden min-w-36 justify-center bg-gray-100/90 px-8 py-4 rounded-sm absolute top-1 right-1 text-md text-gray-500",
          children: showSummary ? "Original" : "Summary"
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `italic text-gray-600 ${showSummary ? "block" : "hidden"} sm:hidden`,
          children: /* @__PURE__ */ jsx(Markdown, { markdown: summary ?? "" })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: `${showSummary ? "hidden" : "block"} sm:block`, children: /* @__PURE__ */ jsx(Markdown, { markdown: content }) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "hidden md:flex flex-col gap-4 italic text-gray-500 text-sm w-96", children: summary && /* @__PURE__ */ jsx(Markdown, { markdown: summary }) })
  ] });
};
function Newsletter() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col mx-auto gap-4", children: [
    /* @__PURE__ */ jsx(
      MarkdownPost,
      {
        content: Newsletter2025Jan19,
        summary: Newsletter2025Jan19Summary
      }
    ),
    /* @__PURE__ */ jsx(
      MarkdownPost,
      {
        content: Newsletter2025Jan6,
        summary: Newsletter2025Jan6Summary
      }
    ),
    /* @__PURE__ */ jsx(
      MarkdownPost,
      {
        content: Newsletter2024Dec10,
        summary: Newsletter2024Dec10Summary
      }
    ),
    /* @__PURE__ */ jsx(MarkdownPost, { content: Newsletter2024Nov24 }),
    /* @__PURE__ */ jsx(MarkdownPost, { content: Newsletter2024Nov14 }),
    /* @__PURE__ */ jsx(MarkdownPost, { content: Newsletter2024Nov10 }),
    /* @__PURE__ */ jsx(MarkdownPost, { content: Newsletter2024Oct31 }),
    /* @__PURE__ */ jsx(MarkdownPost, { content: Newsletter2024Oct17 }),
    /* @__PURE__ */ jsx(MarkdownPost, { content: Newsletter2024Sep21 }),
    /* @__PURE__ */ jsx(MarkdownPost, { content: Newsletter2024Sep11 }),
    /* @__PURE__ */ jsx(MarkdownPost, { content: Newsletter2024Aug21 })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Newsletter,
  meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
const Gallery = () => {
  return /* @__PURE__ */ jsx("div", { className: "bg-white shadow-md p-4 max-w-5xl mx-auto flex gap-2", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-col justify-center", children: /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-600 mb-4 text-center", children: "Florida Championships over the years" }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: "/gallery/photo1.jpg", className: "inline-block", alt: "" }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: "/gallery/photo2.jpg", className: "inline-block", alt: "" }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: "/gallery/photo3.jpg", className: "inline-block", alt: "" }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: "/gallery/photo4.jpg", className: "inline-block", alt: "" }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: "/gallery/photo5.jpg", className: "inline-block", alt: "" }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: "/gallery/photo8.jpg", className: "inline-block", alt: "" }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: "/gallery/photo7.jpg", className: "inline-block", alt: "" }) }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("img", { src: "/gallery/photo9.jpg", className: "inline-block", alt: "" }) })
  ] }) });
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Gallery
}, Symbol.toStringTag, { value: "Module" }));
const leagues = "The Florida *FIRST Tech Challenge*™ robotics program follows the **League** tournament system. The league system allows to attend a practice/scrimmage day typically in late October, 3-4 League Meets between November and January, and a final League Tournament in late January or early February.\n\nThe **League Tournament** is a championship event that includes judge and robot awards and determines which teams participate in the Florida Championship. The Florida Championship determines which Florida teams are invited to the FIRST World Championship.\n\nThe following are the 8 Florida Leagues and locations of the Leagues:\n\n## AeroCoast League\n\nIncludes teams located in the following counties in the Florida panhandle counties: Bay, Calhoun, Escambia, Franklin, Gulf Holmes, Jackson, Jefferson, Leon, Liberty, Madison, Okalossa, Santa Rosa, Taylor, Walton, Wakulla, and Washington.\n\n## F.U.N. (FIRST United Network) League\n\nIncludes teams primarily in the Palm Beach area and the following counties: Palm Beach, Martin, & Saint Lucie.\n\n## Gulf Coast League\n\nIncludes teams on the Florida west coast in the following counties: Pinellas, Manatee, Sarasota, Charlotte, and Lee.\n\n## North East Florida League\n\nIncludes teams in the Jacksonville area and the following counties: Clay, Duval, Alachua, and Nassau counties.\n\n## Orlando Robotics League\n\nIncludes teams and counties surrounding the Orlando area: Orange, Lake Oscelo, Sumter, and Volusia.\n\n## ROBOT League\n\nIncludes teams and counties surrounding the Tampa area: Hillsborough, Pasco, Polk, Hernando, Citrus, and Marion.\n\n## South Florida League\n\nIncludes teams in the Miami area and the following counties: Broward, Miami-Dade, and Monroe.\n\n## Space Coast League\n\nIncludes teams located on the Florida east coast in the following counties: Brevard, Seminole, and Volusia.\n";
const ContentPageHeading = ({
  text,
  image
}) => /* @__PURE__ */ jsxs("div", { className: "relative z-0 -mt-4 -mx-4", children: [
  /* @__PURE__ */ jsx("img", { src: image, alt: "Logo" }),
  /* @__PURE__ */ jsx("div", { className: "h-full absolute top-0 left-0 flex flex-col justify-end", children: /* @__PURE__ */ jsx("h2", { className: "text-6xl font-bold text-white bg-black w-auto py-6 px-4 opacity-80", children: text }) })
] });
const meta$2 = () => {
  return [
    { title: "Leagues | Florida FIRST Tech Challenge" },
    {
      name: "description",
      content: "Explore the various leagues within the Florida FIRST Tech Challenge and find information about each league's events, teams, and more."
    }
  ];
};
function Leagues() {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white shadow-md p-4 max-w-5xl mx-auto flex flex-col gap-2", children: [
    /* @__PURE__ */ jsx(ContentPageHeading, { text: "Leagues", image: "leagues.jpg" }),
    /* @__PURE__ */ jsx(Markdown, { markdown: leagues })
  ] });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Leagues,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
const cover = "The Florida _[FIRST Tech Challenge™](https://www.firstinspires.org/robotics/ftc/what-is-first-tech-challenge)_ program is operated by the Tampa Bay Robotics Foundation and is a sport for engineers. However, FIRST is more than building robots and enables middle and high school students to apply the skills they are learning school in a sports style robotics competition.\n\n_FIRST Tech Challenge™_ teams (grades 6-12) are challenged to design, build, program, and operate robots to compete in a head-to-head challenge in an alliance/team format. The robot kit is reusable from year to year and can be coded using a variety of levels of Java-based programming. Participants are eligible to apply for **$80M+** in college scholarships.\n\nThe Florida _FIRST Tech Challenge™_ program includes **215+** teams from Pensacola to Miami. Florida is organized into [leagues](/leagues) that compete in local events between October and earlier February with some teams qualifying for the Florida Championship in early March.\n\nFor more information contact:\n\nHans Wolf – hanskwolf@gmail.com or hwolf@firstpartners.org\n\nFIRST Program Delivery Partner (PDP)\n";
const meta$1 = () => {
  return [
    { title: "Florida FIRST Tech Challenge" },
    { name: "description", content: "Welcome to Remix!" }
  ];
};
function Index() {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white shadow-md p-4 max-w-5xl mx-auto flex flex-col gap-2", children: [
    /* @__PURE__ */ jsx(
      ContentPageHeading,
      {
        text: "Florida FIRST Tech Challenge",
        image: "cover.jpg"
      }
    ),
    /* @__PURE__ */ jsx(Markdown, { markdown: cover })
  ] });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
const InfoCardHeader = ({ title, secondaryContent }) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl max-w-44", children: title }),
    secondaryContent && /* @__PURE__ */ jsx("h3", { className: "text-md text-gray-400 hover:text-blue-600 italic", children: secondaryContent })
  ] });
};
const InfoCard = ({ children }) => /* @__PURE__ */ jsx("div", { className: "flex flex-col bg-white p-4 shadow-md gap-4", children });
const InfoCardContent = ({ children }) => /* @__PURE__ */ jsx("div", { className: "flex", children });
const InfoCardColumn = ({ children }) => /* @__PURE__ */ jsx("div", { className: "flex flex-col flex-1 gap-2", children });
const InfoCardFooter = ({ children }) => /* @__PURE__ */ jsx("div", { className: "border-t p-4 border-gray-200", children: /* @__PURE__ */ jsx("div", { className: "flex justify-end", children }) });
const InfoCardAttribute = ({ label, value, shouldDisplay = true }) => {
  if (!shouldDisplay) {
    return null;
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
    /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-sm", children: label.toUpperCase() }),
    /* @__PURE__ */ jsx("div", { className: "text-md", children: value || "" })
  ] });
};
const InfoCategory = ({ header, children }) => {
  return /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-600 mb-4 text-center", children: header }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4", children })
  ] });
};
dayjs.extend(utc);
dayjs.extend(timezone);
const prisma = new PrismaClient();
const formatWebsiteUrl = (url) => url.replace(/(https?):\/\/(www\.)?/, "");
const EventRow = ({ event }) => {
  const venue = event.virtual ? /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("em", { children: "Virtual Event" }) }) : /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
    "a",
    {
      className: "hover:text-blue-600",
      href: `https://www.google.com/maps/search/?api=1&query=${[
        event.locationAddress,
        event.locationCity,
        event.locationStateProvince,
        event.locationZip
      ].join("+")}`,
      target: "_blank",
      rel: "noreferrer",
      children: [
        /* @__PURE__ */ jsx("div", { children: event.locationName }),
        /* @__PURE__ */ jsx("div", { children: event.locationAddress }),
        /* @__PURE__ */ jsx("div", { children: `${event.locationCity}, ${event.locationStateProvince}` })
      ]
    }
  ) });
  const venueWebsite = !event.virtual && event.locationWebsite != null ? /* @__PURE__ */ jsx("a", { target: "_blank", rel: "noreferrer", href: event.locationWebsite, children: formatWebsiteUrl(event.locationWebsite) }) : null;
  const isTooEarly = dayjs().isBefore(event.opensAt);
  const isTooLate = dayjs().isAfter(event.closesAt);
  let message = "Registration is unavailable for this event";
  if (isTooEarly) {
    message = "Registration for this event has not yet opened";
  }
  if (isTooLate) {
    message = "Registration for this event has closed";
  }
  const isOpen = !isTooEarly && !isTooLate && event.url;
  return /* @__PURE__ */ jsxs(InfoCard, { children: [
    /* @__PURE__ */ jsx(InfoCardHeader, { title: event.name, secondaryContent: venueWebsite }),
    /* @__PURE__ */ jsxs(InfoCardContent, { children: [
      /* @__PURE__ */ jsxs(InfoCardColumn, { children: [
        /* @__PURE__ */ jsx(
          InfoCardAttribute,
          {
            label: "Date",
            value: /* @__PURE__ */ jsx("span", { className: "local-time", children: dayjs(event.dateEnd).utc().format("MMM D, YYYY") })
          }
        ),
        /* @__PURE__ */ jsx(
          InfoCardAttribute,
          {
            label: "Registration Window",
            value: /* @__PURE__ */ jsxs(Fragment, { children: [
              event.opensAt && /* @__PURE__ */ jsx(
                "span",
                {
                  "data-utc-time": dayjs(event.opensAt).toISOString(),
                  className: "local-time mmmdyyyy",
                  children: dayjs(event.opensAt).format("MMM D, YYYY")
                }
              ),
              " ",
              "-",
              " ",
              event.closesAt && /* @__PURE__ */ jsx(
                "span",
                {
                  "data-utc-time": event.closesAt.toISOString(),
                  className: "local-time mmmdyyyy",
                  children: dayjs(event.closesAt).format("MMM D, YYYY")
                }
              )
            ] }),
            shouldDisplay: !!(event.opensAt && event.closesAt)
          }
        ),
        /* @__PURE__ */ jsx(
          InfoCardAttribute,
          {
            label: "Livestream",
            value: event.liveStreamUrl,
            shouldDisplay: !!event.liveStreamUrl
          }
        ),
        /* @__PURE__ */ jsx(
          InfoCardAttribute,
          {
            label: "Registered",
            value: /* @__PURE__ */ jsxs("span", { children: [
              event.registered.toString(),
              event.capacity > 0 && /* @__PURE__ */ jsxs("span", { className: "text-gray-400", children: [
                " ",
                "out of ",
                event.capacity
              ] })
            ] }),
            shouldDisplay: event.registered > 0 || event.capacity > 0
          }
        ),
        /* @__PURE__ */ jsx(
          InfoCardAttribute,
          {
            label: "Waitlisted",
            value: /* @__PURE__ */ jsxs("span", { children: [
              event.waitlisted.toString(),
              /* @__PURE__ */ jsxs("span", { className: "text-gray-400", children: [
                " ",
                "out of ",
                event.waitlistCapacity
              ] })
            ] }),
            shouldDisplay: event.waitlisted > 0 || event.waitlistCapacity > 0
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(InfoCardColumn, { children: [
        /* @__PURE__ */ jsx(InfoCardAttribute, { label: "Type", value: event.type }),
        /* @__PURE__ */ jsx(InfoCardAttribute, { label: "Venue", value: venue })
      ] })
    ] }),
    /* @__PURE__ */ jsx(InfoCardFooter, { children: isOpen ? /* @__PURE__ */ jsx(
      "a",
      {
        className: "text-white py-2 px-4 rounded bg-blue-500 hover:bg-blue-700",
        href: event.url || "",
        target: "_blank",
        rel: "noreferrer",
        children: "Register"
      }
    ) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("span", { className: "italic text-gray-400", children: message }),
      /* @__PURE__ */ jsx("span", { className: "text-white py-2 px-4 rounded bg-gray-400", children: "Register" })
    ] }) })
  ] });
};
const loader$3 = async () => {
  const persisted = await prisma.$queryRaw`
    SELECT *, MAX(saved_at) as saved_at
    FROM first_event
    GROUP BY season, code
    ORDER BY date_end DESC
  `;
  const events = persisted.map((event) => ({
    id: event.id,
    code: event.code,
    name: event.name,
    type: event.type,
    format: event.format,
    season: event.season,
    website: event.website,
    dateStart: dayjs(event.date_start).toDate(),
    dateEnd: dayjs(event.date_end).toDate(),
    liveStreamUrl: event.live_stream_url,
    leagueName: event.league_name,
    leagueCode: event.league_code,
    leagueRemote: event.league_remote,
    leagueLocation: event.league_location,
    locationName: event.location_name,
    locationAddress: event.location_address,
    locationCity: event.location_city,
    locationStateProvince: event.location_state_province,
    locationCountry: event.location_country,
    locationZip: event.location_zip,
    locationTimezone: event.location_timezone,
    locationWebsite: event.location_website,
    opensAt: event.opens_at ? dayjs(event.opens_at).toDate() : null,
    closesAt: event.closes_at ? dayjs(event.closes_at).toDate() : null,
    open: event.open,
    deadline: event.deadline ? dayjs(event.deadline).toDate() : null,
    url: event.url,
    registered: event.registered || 0,
    capacity: event.capacity || 0,
    waitlisted: event.waitlisted || 0,
    waitlistCapacity: event.waitlist_capacity || 0,
    virtual: event.virtual,
    savedAt: dayjs(Number(event.saved_at)).toDate()
  }));
  events.sort((a, b) => {
    if (!(!a.leagueName || !b.leagueName) && a.leagueName !== b.leagueName) {
      return a.leagueName.localeCompare(b.leagueName);
    }
    return dayjs(a.dateEnd).diff(dayjs(b.dateEnd));
  });
  const leagueCodeToName = events.reduce(
    (acc, event) => {
      const code = event.leagueCode;
      const name = event.leagueName;
      if (code && name) {
        return {
          ...acc,
          [code]: name
        };
      }
      return acc;
    },
    {}
  );
  const leagueEvents = events.reduce(
    (acc, event) => {
      const code = event.leagueCode;
      if (!code) {
        return acc;
      }
      return {
        ...acc,
        [code]: [...acc[code] || [], event]
      };
    },
    {}
  );
  return json({ leagueEvents, leagueCodeToName });
};
const includesEvent = (searchTerm) => (event) => {
  var _a, _b;
  return ((_a = event.name) == null ? void 0 : _a.toLowerCase().includes(searchTerm.toLowerCase())) || ((_b = event.locationName) == null ? void 0 : _b.toLowerCase().includes(searchTerm.toLowerCase()));
};
function Events() {
  const { leagueEvents, leagueCodeToName } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  return /* @__PURE__ */ jsxs("div", { className: "w-full md:min-w-[750px] md:max-w-prose", children: [
    /* @__PURE__ */ jsx("div", { className: "w-full flex flex-col items-center", children: /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        placeholder: "Search events...",
        className: "md:w-2/3 w-full p-2 mb-4 border rounded bg-white"
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "w-full", children: Object.entries(leagueEvents).sort(([aLeagueCode], [bLeagueCode]) => {
      if (aLeagueCode === "FLDEF") return -1;
      if (bLeagueCode === "FLDEF") return 1;
      return 0;
    }).filter(([_, events]) => events.some(includesEvent(searchTerm))).map(([leagueCode, events]) => /* @__PURE__ */ jsx(
      InfoCategory,
      {
        header: leagueCodeToName[leagueCode],
        children: events.filter(includesEvent(searchTerm)).map((event) => /* @__PURE__ */ jsx(
          EventRow,
          {
            event: {
              ...event,
              dateStart: dayjs(event.dateStart).toDate(),
              dateEnd: dayjs(event.dateEnd).toDate(),
              opensAt: event.opensAt ? dayjs(event.opensAt).toDate() : null,
              closesAt: event.closesAt ? dayjs(event.closesAt).toDate() : null,
              deadline: event.deadline ? dayjs(event.deadline).toDate() : null,
              savedAt: dayjs(event.savedAt).toDate()
            }
          },
          event.id
        ))
      },
      leagueCode
    )) })
  ] });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Events,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async () => {
  const prisma2 = new PrismaClient();
  const videos = await prisma2.firstVideo.findMany({
    orderBy: [{ event_code: "asc" }, { team: "asc" }]
  });
  const teams = await prisma2.firstTeam.findMany();
  return json({ videos, teams });
};
function Videos() {
  const { videos, teams } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const groupedVideos = videos.filter(
    (video) => video.event_name.toLowerCase().includes(searchTerm.toLowerCase()) || video.team.toString().includes(searchTerm.toLowerCase()) || video.award.toLowerCase().includes(searchTerm.toLowerCase())
  ).reduce(
    (acc, video) => {
      if (!acc[video.event_code]) {
        acc[video.event_code] = {
          name: video.event_name,
          videos: []
        };
      }
      acc[video.event_code].videos.push(video);
      return acc;
    },
    {}
  );
  return /* @__PURE__ */ jsxs("div", { className: "w-full md:min-w-[750px] md:max-w-prose flex flex-col gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "w-full flex flex-col items-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold", children: "Award Videos" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Below, you can find video submissions for the Compass award." }),
      /* @__PURE__ */ jsxs("p", { className: "text-gray-500", children: [
        "To submit a video, please login to",
        " ",
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "https://ftcregion.com",
            target: "_blank",
            rel: "noreferrer",
            className: "text-blue-600 hover:underline",
            children: "Region Manager"
          }
        ),
        ", find the event, and provide the video URL."
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col w-full mx-auto", children: Object.entries(groupedVideos).map(([eventCode, { name, videos: videos2 }]) => /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-600 mb-4 text-center", children: name }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4", children: videos2.filter((video) => video.url).map((video) => {
        var _a;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex flex-row bg-white p-4 shadow-md gap-4",
            children: [
              /* @__PURE__ */ jsx("div", { children: video.team }),
              /* @__PURE__ */ jsx("div", { children: ((_a = teams.find((team) => team.number === video.team)) == null ? void 0 : _a.name) ?? "Unknown Team" }),
              /* @__PURE__ */ jsx("div", { className: "flex-grow text-right", children: video.url ? /* @__PURE__ */ jsx(
                "a",
                {
                  href: video.url,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "text-blue-600 hover:underline text-sm",
                  children: "Watch Video →"
                }
              ) : /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-sm", children: "Coming Soon" }) })
            ]
          },
          `${video.event_code}-${video.team}`
        );
      }) })
    ] }, eventCode)) })
  ] });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Videos,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const about = "Hello!\n\nThis site was created by me, [Jeremy School](https://jeremy.school) - I hope you find it useful! If you have feedback or are interested in working together on a project, feel free to send an email to contact@jeremy.school.\n\nThanks for stopping by!\n";
const meta = () => {
  return [
    { title: "About | Florida FIRST Tech Challenge" },
    { name: "description", content: "Welcome to Remix!" }
  ];
};
function About() {
  return /* @__PURE__ */ jsx("div", { className: "bg-white shadow-md p-4 max-w-5xl mx-auto flex flex-col gap-2", children: /* @__PURE__ */ jsx(Markdown, { markdown: about }) });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: About,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const ArrowRight = ({
  className = ""
}) => {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 16 16",
      fill: "currentColor",
      className: `size-4 ${className}`.trim(),
      children: /* @__PURE__ */ jsx(
        "path",
        {
          fillRule: "evenodd",
          clipRule: "evenodd",
          d: "M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z"
        }
      )
    }
  );
};
const DisplayLink = ({ url }) => {
  const displayUrl = url == null ? void 0 : url.toLowerCase().replace(/(https?)\:\/\/(www\.)?/, "").replace(/\/$/, "");
  return /* @__PURE__ */ jsx("a", { href: url, target: "_blank", rel: "noreferrer", children: displayUrl });
};
const TeamRow = ({ team }) => {
  return /* @__PURE__ */ jsxs(InfoCard, { children: [
    /* @__PURE__ */ jsx(
      InfoCardHeader,
      {
        title: `${team.number} - ${team.name}`,
        secondaryContent: team.website && /* @__PURE__ */ jsx(DisplayLink, { url: team.website })
      }
    ),
    /* @__PURE__ */ jsxs(InfoCardContent, { children: [
      /* @__PURE__ */ jsxs(InfoCardColumn, { children: [
        /* @__PURE__ */ jsx(InfoCardAttribute, { label: "City", value: team.location.city }),
        /* @__PURE__ */ jsx(InfoCardAttribute, { label: "County", value: team.location.county })
      ] }),
      /* @__PURE__ */ jsxs(InfoCardColumn, { children: [
        /* @__PURE__ */ jsx(InfoCardAttribute, { label: "Rookie Year", value: team.rookieYear }),
        /* @__PURE__ */ jsx(
          InfoCardAttribute,
          {
            label: "Event Ready?",
            value: team.eventReady ? "Yes" : /* @__PURE__ */ jsxs("a", { href: team.url, target: "_blank", rel: "noreferrer", children: [
              /* @__PURE__ */ jsx("span", { children: "No - " }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-400 hover:text-blue-600", children: [
                "Coaches, get ready now",
                /* @__PURE__ */ jsx(ArrowRight, { className: "inline" })
              ] })
            ] })
          }
        )
      ] })
    ] })
  ] });
};
const loader$1 = async () => {
  const prisma2 = new PrismaClient();
  const persisted = await prisma2.$queryRaw`
    SELECT *
    FROM first_teams
    ORDER BY website is null, CAST(number as INTEGER) ASC
  `;
  const teams = persisted.map((team) => {
    const hasNoLeague = !team.league_code || !team.league_name;
    return {
      id: team.id,
      name: team.name,
      number: team.number,
      location: {
        city: team.location_city,
        country: team.location_country,
        state_province: team.location_state_province,
        county: team.location_county
      },
      league: hasNoLeague ? null : {
        code: team.league_code,
        name: team.league_name,
        remote: team.league_remote,
        location: team.league_location
      },
      rookieYear: team.rookie_year,
      website: team.website,
      url: team.url,
      eventReady: team.event_ready,
      savedAt: dayjs(Number(team.saved_at)).toDate()
    };
  });
  return json({ teams });
};
function Teams() {
  const { teams } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const groupedTeams = teams.filter(
    (team) => team.name.toLowerCase().includes(searchTerm.toLowerCase()) || team.number.toString().toLowerCase().includes(searchTerm.toLowerCase()) || team.location.city.toLowerCase().includes(searchTerm.toLowerCase()) || team.location.state_province.toLowerCase().includes(searchTerm.toLowerCase())
  ).reduce(
    (acc, team) => {
      var _a;
      const leagueCode = ((_a = team.league) == null ? void 0 : _a.code) || "Unknown";
      if (!acc[leagueCode]) {
        acc[leagueCode] = [];
      }
      acc[leagueCode].push(team);
      return acc;
    },
    {}
  );
  const leagueCodeToName = teams.reduce(
    (acc, team) => {
      const league = team.league;
      if (!league) return acc;
      return {
        ...acc,
        [league.code]: league.name
      };
    },
    {}
  );
  return /* @__PURE__ */ jsxs("div", { className: "w-full md:min-w-[750px] md:max-w-prose", children: [
    /* @__PURE__ */ jsx("div", { className: "w-full flex flex-col items-center", children: /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value),
        placeholder: "Search teams...",
        className: "md:w-2/3 w-full p-2 mb-4 border rounded bg-white"
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col w-full mx-auto", children: Object.entries(groupedTeams).map(([leagueCode, teams2]) => /* @__PURE__ */ jsx(
      InfoCategory,
      {
        header: leagueCodeToName[leagueCode] || "Unknown",
        children: teams2.map((team) => /* @__PURE__ */ jsx(TeamRow, { team }, team.number))
      },
      leagueCode
    )) })
  ] });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Teams,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
function loader({ params }) {
  if (params["*"] === "index.php") {
    return redirect("/");
  }
  return null;
}
function NotFound() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [
    /* @__PURE__ */ jsx("div", { className: "w-full md:w-auto flex justify-center", children: /* @__PURE__ */ jsx("img", { src: "/404.jpg", className: "w-full max-w-md rounded-lg shadow-sm" }) }),
    /* @__PURE__ */ jsxs("div", { className: "w-full md:w-auto", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-600 mb-4", children: "We looked everywhere, but couldn't find that!" }),
      /* @__PURE__ */ jsx("p", { children: "The page you are looking for doesn't exist or the URL may have changed." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "If you are looking for this season's currently scheduled events, you can try",
            " ",
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/events",
                className: "text-gray-500 underline hover:text-blue-600",
                children: "here"
              }
            ),
            "."
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "If you are looking for information on",
            " ",
            /* @__PURE__ */ jsx("i", { children: "Florida FIRST Tech Challenge™" }),
            " teams, you can try",
            " ",
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "/teams",
                className: "text-gray-500 underline hover:text-blue-600",
                children: "here"
              }
            ),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsxs("span", { children: [
          "Additionally, copies of Hans' newsletters can be found",
          " ",
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "/newsletter",
              className: "text-gray-500 underline hover:text-blue-600",
              children: "here"
            }
          ),
          "."
        ] }) })
      ] })
    ] })
  ] });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: NotFound,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-B-G-elFD.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/components-C5c64wmR.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CPbg51Zv.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/components-C5c64wmR.js"], "css": ["/assets/root-BqRT6muG.css"] }, "routes/newsletter": { "id": "routes/newsletter", "parentId": "root", "path": "newsletter", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/newsletter-Dr6vhLi4.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/markdown-nVLLpt3n.js"], "css": [] }, "routes/gallery": { "id": "routes/gallery", "parentId": "root", "path": "gallery", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/gallery-CUBMyBhQ.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js"], "css": [] }, "routes/leagues": { "id": "routes/leagues", "parentId": "root", "path": "leagues", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/leagues-B3JFqO1h.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/markdown-nVLLpt3n.js", "/assets/content-page-heading-dsc4FPMR.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-Btpa_FpI.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/content-page-heading-dsc4FPMR.js", "/assets/markdown-nVLLpt3n.js"], "css": [] }, "routes/events": { "id": "routes/events", "parentId": "root", "path": "events", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/events-CeWbl6M_.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/info-category-DNcmEVWn.js", "/assets/components-C5c64wmR.js"], "css": [] }, "routes/videos": { "id": "routes/videos", "parentId": "root", "path": "videos", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/videos-DSxO7lul.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/components-C5c64wmR.js"], "css": [] }, "routes/about": { "id": "routes/about", "parentId": "root", "path": "about", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/about-pRnX2wgm.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/markdown-nVLLpt3n.js"], "css": [] }, "routes/teams": { "id": "routes/teams", "parentId": "root", "path": "teams", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/teams-DBJ13Izg.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js", "/assets/info-category-DNcmEVWn.js", "/assets/components-C5c64wmR.js"], "css": [] }, "routes/$": { "id": "routes/$", "parentId": "root", "path": "*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_-C46XZiQX.js", "imports": ["/assets/jsx-runtime-d4vcKfGz.js"], "css": [] } }, "url": "/assets/manifest-db925295.js", "version": "db925295" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false, "unstable_routeConfig": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/newsletter": {
    id: "routes/newsletter",
    parentId: "root",
    path: "newsletter",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/gallery": {
    id: "routes/gallery",
    parentId: "root",
    path: "gallery",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/leagues": {
    id: "routes/leagues",
    parentId: "root",
    path: "leagues",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route4
  },
  "routes/events": {
    id: "routes/events",
    parentId: "root",
    path: "events",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/videos": {
    id: "routes/videos",
    parentId: "root",
    path: "videos",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/about": {
    id: "routes/about",
    parentId: "root",
    path: "about",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/teams": {
    id: "routes/teams",
    parentId: "root",
    path: "teams",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/$": {
    id: "routes/$",
    parentId: "root",
    path: "*",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
