import express, { type Express } from "express";
import cors from "cors";
import { groupsRouter } from "./routes/groups.js";
import { preferencesRouter } from "./routes/preferences.js";
import { consensusRouter } from "./routes/consensus.js";
import { candidatesRouter } from "./routes/candidates.js";
import { usersRouter } from "./routes/users.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app: Express = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/groups", groupsRouter);
app.use("/api/v1/preferences", preferencesRouter);
app.use("/api/v1/consensus", consensusRouter);
app.use("/api/v1/candidates", candidatesRouter);
app.use("/api/v1/users", usersRouter);

app.use(errorHandler);

export default app;
