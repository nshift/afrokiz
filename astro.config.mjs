import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue({
      appEntrypoint: "/src/app",
    }),
  ],
  output: "server",
  adapter: netlify(),
});
