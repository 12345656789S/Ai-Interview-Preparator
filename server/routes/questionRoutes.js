import express from "express";

import {
  generateQuestions
} from "../controllers/questionController.js";

const router = express.Router();

router.get(
  "/generate/:resumeId",
  generateQuestions
);

export default router;