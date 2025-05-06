import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8", // or instabul
      reporter: ["text", "html", "lcov"], // controls output formats
    },
  },
});
