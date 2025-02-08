/// <reference types="@cloudflare/workers-types" />
import { Hono } from "hono";

type Bindings = {
    DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>();

export default app;
