import { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "@consensus/shared";
type IO = Server<ClientToServerEvents, ServerToClientEvents>;
export declare function registerHandlers(io: IO): void;
export {};
//# sourceMappingURL=handlers.d.ts.map