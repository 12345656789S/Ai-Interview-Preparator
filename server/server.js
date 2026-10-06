require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();

const questionRoutes = require("./routes/questionRoutes");

app.use(express.json());

app.use("/api/questions", questionRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully ✅"))
  .catch((err) => console.log("MongoDB Connection Failed ❌", err));

app.get("/", (req, res) => {
  res.send("PrepPilotAI Backend Running 🚀");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});