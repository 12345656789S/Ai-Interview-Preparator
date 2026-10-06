export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume",
      });
    }

    const file = req.file;

    res.status(200).json({
      success: true,
      message: "Resume uploaded successfully",
      file: {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);

    res.status(500).json({
      success: false,
      message: "Resume upload failed",
    });
  }
};