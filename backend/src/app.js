import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { env, isTest, isProduction } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

// An API client with a JSON default header sends Content-Type: application/json even on a
// bodyless PATCH or POST, and express.json() rejects the zero-length payload as invalid JSON.
app.use((req, res, next) => {
  if (req.headers["content-length"] === "0") delete req.headers["content-type"];
  next();
});

app.use(express.json({ limit: "100kb" }));
if (!isTest) app.use(morgan(isProduction ? "combined" : "dev"));

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
