import Resume from "../models/Resume.js";
import parseResume from "../services/resumeParser.js";

export const uploadResume = async (req, res, next) => {
  try {
    console.log("FILE RECEIVED:", req.file);
    console.log("BODY:", req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file received. Make sure form field name is 'resume'."
      });
    }

    const extractedText = await parseResume(
      req.file.path,
      req.file.mimetype
    );

    const resume = await Resume.create({
      originalName: req.file.originalname,
      filePath: req.file.path,
      extractedText
    });

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resumeId: resume._id,
      fileName: resume.originalName
    });

  } catch (error) {
    next(error);
  }
};