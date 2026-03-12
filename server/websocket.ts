import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { FileChangeEvent } from "./file-watcher.js";

const HEARTBEAT_INTERVAL = 30_000;

interface AliveWebSocket extends WebSocket {
  isAlive: boolean;
}

export function setupWebSockets(server: http.Server): {
  filesWss: WebSocketServer;
  chatWss: WebSocketServer;
  broadcastFileChange: (event: FileChangeEvent) => void;
} {
  const filesWss = new WebSocketServer({ noServer: true });
  const chatWss = new WebSocketServer({ noServer: true });

  // Route upgrade requests by URL path
  server.on("upgrade", (request, socket, head) => {
    const { url } = request;

    if (url === "/api/ws/files") {
      filesWss.handleUpgrade(request, socket, head, (ws) => {
        filesWss.emit("connection", ws, request);
      });
    } else if (url === "/api/ws/chat") {
      chatWss.handleUpgrade(request, socket, head, (ws) => {
        chatWss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Heartbeat for files WebSocket
  filesWss.on("connection", (ws: AliveWebSocket) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  const filesHeartbeat = setInterval(() => {
    for (const ws of filesWss.clients as Set<AliveWebSocket>) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  filesWss.on("close", () => {
    clearInterval(filesHeartbeat);
  });

  // Heartbeat for chat WebSocket
  chatWss.on("connection", (ws: AliveWebSocket) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  });

  const chatHeartbeat = setInterval(() => {
    for (const ws of chatWss.clients as Set<AliveWebSocket>) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);

  chatWss.on("close", () => {
    clearInterval(chatHeartbeat);
  });

  // Broadcast file changes to all connected /api/ws/files clients
  function broadcastFileChange(event: FileChangeEvent): void {
    const message = JSON.stringify(event);
    for (const client of filesWss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  return { filesWss, chatWss, broadcastFileChange };
}
