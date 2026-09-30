import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig(({ command, mode }) => ({
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
  optimizeDeps: {
    //If preact and react are optimized, there will be multiple instances of preact and HMR will break
    exclude: ["react", "preact", "react-dom"],
  },
  plugins: [
    command == "serve" && require("@prefresh/vite")(),
    //Extra nomodule bundle for old engines, e.g. Samsung signage (Tizen 4 = Chromium 56)
    command == "build" &&
      legacy({
        targets: ["chrome >= 56"],
        additionalLegacyPolyfills: [
          //Patches fetch too, so aborted long-polls reject instead of lingering
          "abortcontroller-polyfill/dist/polyfill-patch-fetch",
        ],
      }),
  ].filter((plugin) => !!plugin),
  define: {
    global: "globalThis",
  },
  //plugin-legacy doesn't transpile workers, so lower their syntax for Chromium 56 here
  worker: {
    rolldownOptions: { transform: { target: "chrome56" } },
  },
  build: {
    sourcemap: true,
  },
}));
