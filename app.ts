
import { Context } from "./lib/contexts/context.ts";
import { Environment } from "./lib/enums/environment.ts";

const ctx = new Context(Deno.env.get("ENVIRONMENT") as Environment);

ctx.start();
