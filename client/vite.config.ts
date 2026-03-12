import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "client",
  server: {
    proxy: {
      "/api/ws": {
        target: "http://localhost:4111",
        ws: true,
      },
      "/api": {
        target: "http://localhost:4111",
      },
    },
  },
});
