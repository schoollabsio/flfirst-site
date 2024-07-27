import { Context } from "./lib/contexts/context";
import { Environment } from "./lib/enums/environment";

const ctx = new Context(process.env.ENVIRONMENT as Environment);

ctx.start();
