import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
// Importing db triggers schema creation on startup
import "./db/db.js";
import { registerHandlers } from "./socket/handlers.js";
const PORT = process.env["PORT"] ?? "3001";
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});
registerHandlers(io);
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
export { server };
//# sourceMappingURL=index.js.map