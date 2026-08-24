import type { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "@consensus/shared";
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
export declare function registerHandlers(io: AppServer): void;
export {};
//# sourceMappingURL=handlers.d.ts.map