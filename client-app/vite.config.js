import { defineConfig } from "vite";

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
  plugins: [command == "serve" && require("@prefresh/vite")()].filter(
    (plugin) => !!plugin
  ),
  define: {
    global: "window",
  },
  build: {
    sourcemap: true,
  },
}));
