// load-context.ts
import type { AppLoadContext } from 'react-router'
import type { Context } from 'hono'
import type { PlatformProxy } from 'wrangler'

interface Env {
    Bindings: {
        DB: D1Database
    }
}

type Cloudflare = Omit<PlatformProxy, 'dispose'>

declare module 'react-router' {
    interface AppLoadContext {
        cloudflare: Cloudflare
        hono: {
            context: Context<Env>
        }
    }
}

type GetLoadContext = (args: {
    request: Request
    context: {
        cloudflare: Cloudflare
        hono: { context: Context<Env> }
    }
}) => AppLoadContext

export const getLoadContext: GetLoadContext = ({ context }) => {
    return {
        ...context,
    }
}
