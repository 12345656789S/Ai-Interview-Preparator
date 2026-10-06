import Resume from "../models/Resume.js";

export const generateQuestions = async (req, res, next) => {
  try {
    const { resumeId } = req.params;

    // Find resume in MongoDB
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found."
      });
    }

    // Check extracted resume text
    if (!resume.extractedText) {
      return res.status(400).json({
        success: false,
        message: "Resume text is not available."
      });
    }

    const text = resume.extractedText.toLowerCase();

    // Skills we want to detect
    const skills = [
      "javascript",
      "react",
      "node.js",
      "express",
      "mongodb",
      "python",
      "java",
      "sql",
      "html",
      "css",
      "bootstrap",
      "ai",
      "machine learning"
    ];

    const detectedSkills = skills.filter((skill) =>
      text.includes(skill.toLowerCase())
    );

    // Basic resume-based questions
    const questions = [
      "Tell me about yourself and walk me through your resume.",
      "Which project on your resume are you most proud of and why?",
      "What was the biggest challenge you faced while working on your project?",
      "How did you test and debug your project?",
      "What would you improve in your project if you had more time?",
      "Explain your technical skills and how you have used them.",
      "What role did you personally play in your projects?",
      "Why are you interested in this position?"
    ];

    // Generate skill-specific questions
    detectedSkills.forEach((skill) => {
      questions.push(
        `Explain your experience with ${skill}.`
      );

      questions.push(
        `What challenges have you faced while working with ${skill}?`
      );
    });

    return res.json({
      success: true,
      resumeId: resume._id,
      skillsDetected: detectedSkills,
      totalQuestions: questions.length,
      questions
    });

  } catch (error) {
    next(error);
  }
};