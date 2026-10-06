import Resume from "../models/Resume.js";

import {
  getNextInterviewQuestion,
  evaluateInterview
} from "../services/aiInterviewService.js";

export const getNextQuestion = async (req, res, next) => {
  try {
    const {
      resumeId,
      conversation = []
    } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "resumeId is required"
      });
    }

    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    if (!resume.extractedText) {
      return res.status(400).json({
        success: false,
        message: "Resume text not available"
      });
    }

    const question = await getNextInterviewQuestion({
      resumeText: resume.extractedText,
      conversation
    });

    res.json({
      success: true,
      question
    });

  } catch (error) {
    next(error);
  }
};


// ==========================================
// FINAL AI EVALUATION
// ==========================================

export const getInterviewEvaluation = async (
  req,
  res,
  next
) => {
  try {
    const {
      resumeId,
      conversation = []
    } = req.body;

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "resumeId is required"
      });
    }

    if (!conversation.length) {
      return res.status(400).json({
        success: false,
        message: "No interview answers found"
      });
    }

    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    const evaluation = await evaluateInterview({
      resumeText: resume.extractedText,
      conversation
    });

    res.json({
      success: true,
      evaluation
    });

  } catch (error) {
    next(error);
  }
};

