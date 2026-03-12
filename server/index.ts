import express from "express";
import http from "node:http";
import { setupWebSockets } from "./websocket.js";
import { createFileWatcher } from "./file-watcher.js";
import { getStreamsDir } from "./lib/paths.js";
import streamsRouter from "./routes/streams.js";
import dayPlanRouter from "./routes/day-plan.js";
import ideasRouter from "./routes/ideas.js";
import githubRouter from "./routes/github.js";
import chatRouter from "./routes/chat.js";

const app = express();
const server = http.createServer(app);
const PORT = 4111;

app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/streams", streamsRouter);
app.use("/api/day-plan", dayPlanRouter);
app.use("/api/ideas", ideasRouter);
app.use("/api/github", githubRouter);
app.use("/api/chat", chatRouter);

const { broadcastFileChange } = setupWebSockets(server);
const streamsDir = getStreamsDir();
createFileWatcher(streamsDir, broadcastFileChange);

server.listen(PORT, () => {
  console.log(`Topside server running on http://localhost:${PORT}`);
  console.log(`Watching: ${streamsDir}`);
});
