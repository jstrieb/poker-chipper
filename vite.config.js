import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  base: "./",
  plugins: [svelte()],
  // Required for web worker to be bundled correctly
  worker: {
    rollupOptions: {
      output: {
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    headers: {
      // Necessary for testing service workers locally in Firefox and Chrome.
      // For more info, see:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1429714
      "service-worker-allowed": "/",
    },
  },
});
