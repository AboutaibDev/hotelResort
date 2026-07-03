const { WebSocketServer } = require("ws");
const http = require("http");
const jwt = require("jsonwebtoken");
const url = require("url");
const fs = require("fs");
const path = require("path");

// Load .env manually (ws-server is plain Node — no Next.js env loading)
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const PORT = process.env.WS_PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || "amanora_resort_secret_jwt_key_2026_secure";


// Map to store userId -> WebSocket connection
const clients = new Map();

// Create HTTP server to handle both WebSocket and POST notifications
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/notify") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { userId, title, message, type, created_at, id } = payload;

        if (!userId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "userId is required" }));
          return;
        }

        // Find client socket
        const clientSocket = clients.get(Number(userId));
        if (clientSocket && clientSocket.readyState === 1) { // OPEN
          clientSocket.send(JSON.stringify({
            id,
            title,
            message,
            type,
            created_at: created_at || new Date().toISOString(),
            is_read: false
          }));
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, delivered: true }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, delivered: false, reason: "User not connected" }));
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  const parsedUrl = url.parse(request.url, true);
  const token = parsedUrl.query.token;

  if (!token) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
    
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } catch (err) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
  }
});

wss.on("connection", (ws, request) => {
  const userId = Number(request.user.id);
  clients.set(userId, ws);
  console.log(`User ${userId} connected to WebSockets.`);

  ws.on("close", () => {
    clients.delete(userId);
    console.log(`User ${userId} disconnected.`);
  });

  ws.on("error", (err) => {
    console.error(`Socket error for user ${userId}:`, err);
    clients.delete(userId);
  });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Stop the other process first, then retry.`);
  } else {
    console.error("WebSocket server error:", err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`✅ WebSocket & HTTP Notification server running on port ${PORT}`);
});
