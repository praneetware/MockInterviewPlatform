import express from "express";
import authRoutes from "./routes/authRoutes";
import resumeRoutes
from "./routes/resumeRoutes";

import templateRoutes
from "./routes/templateRoutes";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.use("/api/auth", authRoutes);

app.use("/api/resume", resumeRoutes);

import interviewRoutes
from "./routes/interviewRoutes";
app.use(
  "/api/interview",
  interviewRoutes
);

app.use(
 "/api/interviews",
 interviewRoutes
);

app.use(
 "/api/templates",
 templateRoutes
);

export default app;