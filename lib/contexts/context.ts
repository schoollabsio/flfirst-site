import Fastify from "npm:fastify";
import { Database } from "npm:sqlite";
import { createClient } from "npm:@libsql/client";
import { Environment } from "../enums/environment.ts";
import { FragmentController } from "../controllers/fragment-controller.ts";
import { EventsTable } from "../controllers/fragments/events-table.ts";
import { Fragment, Params, Query } from "../controllers/fragments/interface.ts";
import { TeamsTable } from "../controllers/fragments/teams-table.ts";
import { Page } from "../controllers/fragments/page.ts";
import { VideosTable } from "../controllers/fragments/videos-table.ts";

export class Context {

    constructor(
        private environment: Environment,
    )  {}

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

    get fragments(): { [key: string]: Fragment }{
        return {
            "page": this.page,
            "events": this.eventsTable,
            "teams": this.teamsTable,
            "videos": this.videosTable,
        };
    }

    get fragmentController() {
        return new FragmentController(this);
    }

    get app() {
        const app = Fastify();
        app.register(import("npm:@fastify/static"), {
            root: Deno.cwd() + '/static/',
        });

        app.get('/fragments/:id', async (request, reply) => {
            const fragment = await this.fragmentController.load(request.params as Params, request.query as Query);
            reply.send(fragment);
        });

        return app;
    }

    // get db()  {
    //     const db = new Database({
    //         filename: "./data.db",
    //         driver: Database,
    //     });
    //     db.open();
    //     return db;
    // }

    get turso() {
        return createClient({
            url: Deno.env.get("TURSO_DATABASE_URL"),
            authToken: Deno.env.get("TURSO_AUTH_TOKEN"),
        });
    }

    get settings() {
        return {
            environment: this.environment,
            port: Deno.env.get("PORT") || 3000,
        }
    }

    async start() {
        try {
            await this.app.listen({
                host: '0.0.0.0',
                port: this.settings.port,
            });
            console.log(`Server listening on http://localhost:${this.settings.port}`);
          } catch (err) {
            console.error(err);
          }
    }

}
