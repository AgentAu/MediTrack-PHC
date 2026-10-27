/**
 * MediTrack PHC API server
 * ------------------------------------------------------------------
 * React client  --HTTP/JSON + Firebase ID token-->  Express (this)
 *                                                   --Admin SDK--> Firestore
 * ------------------------------------------------------------------
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { authenticate } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import patientRoutes from "./routes/patients.js";
import staffRoutes from "./routes/staff.js";
import miscRoutes from "./routes/misc.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.disable("x-powered-by");
app.use(cors({ origin: CLIENT_ORIGIN.split(",").map((o) => o.trim()) }));
app.use(express.json({ limit: "100kb" }));

// Public: lets you check the server is up.
app.get("/api/health", (req, res) => res.json({ status: "ok", service: "meditrack-phc-api" }));

// Everything below requires a signed-in staff member.
app.use("/api", authenticate);
app.use("/api", miscRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/staff", staffRoutes);

app.use("/api", notFoundHandler);
app.use(errorHandler);

// On Vercel the platform runs the exported app; locally we start a server.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[MediTrack] API running on http://localhost:${PORT}`);
    console.log(`[MediTrack] Accepting requests from ${CLIENT_ORIGIN}`);
  });
}

export default app;