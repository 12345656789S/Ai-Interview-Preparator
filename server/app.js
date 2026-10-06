import dotenv from "dotenv";
dotenv.config();
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import connectDB from "./config/db.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";


import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
dotenv.config();
const app = express();

// ================= MIDDLEWARE =================

app.use(cors());
app.use(express.json());

// ================= ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);
// ================= HOME ROUTE =================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PrepPilotAI Server Running"
  });
});

// ================= MONGODB =================



mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully ✅");
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed ❌", err.message);
  });

// ================= ERROR HANDLER =================

app.use((error, req, res, next) => {
  console.error("Server Error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal Server Error"
  });
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});