import adapter from "@hono/vite-dev-server/cloudflare";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import serverAdapter from "hono-react-router-adapter/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from './load-context'

export default defineConfig((_) => ({
  ssr: {
    resolve: {
      externalConditions: ["workerd", "worker"],
    },
  },
  plugins: [
    reactRouter(),
    serverAdapter({
      adapter,
      getLoadContext,
      entry: "server/index.ts",
    }),
    tailwindcss(),
    tsconfigPaths(),
  ],
}));
