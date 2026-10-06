import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/*
=========================================================
1. EVALUATE ONE ANSWER
=========================================================
*/

router.post("/evaluate-answer", async (req, res) => {
  try {
    const {
      question = "",
      answer = "",
    } = req.body;

    if (!question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    if (!answer.trim()) {
      return res.status(400).json({
        success: false,
        message: "Answer is required.",
      });
    }

    const prompt = `
You are a professional job interview evaluator.

Evaluate the candidate's answer to the interview question.

Return ONLY valid JSON.

Use this exact format:

{
  "score": 0,
  "communication": 0,
  "technicalKnowledge": 0,
  "relevance": 0,
  "strengths": [],
  "improvements": [],
  "feedback": ""
}

Rules:
- All scores must be between 0 and 10.
- score = overall quality of this particular answer.
- communication = clarity and structure.
- technicalKnowledge = correctness of technical content when applicable.
- relevance = how directly the answer answers the question.
- strengths should contain 1-3 short points.
- improvements should contain 1-3 short points.
- feedback should be a short, friendly explanation.
- Do not judge the person's personality.
- Do not invent experience that the candidate did not mention.

Interview Question:
${question}

Candidate Answer:
${answer}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const raw = response.text;

    let evaluation;

    try {
      evaluation = JSON.parse(raw);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);

      evaluation = {
        score: 5,
        communication: 5,
        technicalKnowledge: 5,
        relevance: 5,
        strengths: [
          "You attempted the question.",
        ],
        improvements: [
          "Try to give a more structured answer.",
        ],
        feedback: raw,
      };
    }

    res.json({
      success: true,
      evaluation,
    });

  } catch (error) {
    console.error("Answer Evaluation Error:", error);

    res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to evaluate the answer.",
    });
  }
});


/*
=========================================================
2. FINAL INTERVIEW EVALUATION
=========================================================
*/

router.post("/feedback", async (req, res) => {
  try {
    const {
      conversation = [],
    } = req.body;

    if (!conversation.length) {
      return res.status(400).json({
        success: false,
        message: "Interview conversation is empty.",
      });
    }

    const prompt = `
You are a professional interview evaluator.

Analyze the candidate's complete mock interview.

Return ONLY valid JSON.

Use exactly this structure:

{
  "overallScore": 0,
  "technicalKnowledge": 0,
  "communication": 0,
  "confidence": 0,
  "problemSolving": 0,
  "strengths": [],
  "improvements": [],
  "finalFeedback": ""
}

Rules:
- Scores must be between 0 and 100.
- strengths should contain 3-5 points.
- improvements should contain 3-5 points.
- finalFeedback should be a short professional summary.
- Base everything only on the provided interview.
- Do not invent information.

Complete Interview:
${JSON.stringify(conversation, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const raw = response.text;

    let evaluation;

    try {
      evaluation = JSON.parse(raw);
    } catch (parseError) {
      console.error("Final JSON Parse Error:", parseError);

      evaluation = {
        overallScore: 50,
        technicalKnowledge: 50,
        communication: 50,
        confidence: 50,
        problemSolving: 50,
        strengths: [
          "Interview completed.",
        ],
        improvements: [
          "Continue practicing interview questions.",
        ],
        finalFeedback: raw,
      };
    }

    res.json({
      success: true,
      evaluation,
    });

  } catch (error) {
    console.error("Final Feedback Error:", error);

    res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to generate final feedback.",
    });
  }
});


export default router;