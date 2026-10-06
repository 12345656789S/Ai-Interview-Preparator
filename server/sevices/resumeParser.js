import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const parseResume = async (filePath, mimetype) => {
  const extension = path.extname(filePath).toLowerCase();

  // PDF
  if (mimetype === "application/pdf" || extension === ".pdf") {
    const buffer = fs.readFileSync(filePath);

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    await parser.destroy();

    return result.text.trim();
  }

  // DOCX
  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const result = await mammoth.extractRawText({
      path: filePath
    });

    return result.value.trim();
  }

  throw new Error("Only PDF and DOCX resumes are supported.");
};

export default parseResume;