import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const getNextInterviewQuestion = async ({
  resumeText,
  conversation
}) => {
  const conversationText = conversation
    .map(
      (item, index) =>
        `Question ${index + 1}: ${item.question}\nCandidate Answer: ${item.answer}`
    )
    .join("\n\n");

  const prompt = `
You are an AI interviewer conducting a professional job interview.

You have the candidate's resume below.

RESUME:
${resumeText}

PREVIOUS INTERVIEW:
${conversationText || "No previous questions. This is the beginning of the interview."}

Your job is to conduct a realistic interview.

Rules:
1. Ask ONLY ONE question.
2. Ask questions based on the candidate's resume.
3. Ask about projects, skills, technologies, education and experience mentioned in the resume.
4. After an answer, ask a relevant follow-up question when appropriate.
5. Do not ask multiple questions at once.
6. Do not give long explanations.
7. Sound like a real professional interviewer.
8. Do not repeat a question that has already been asked.
9. If the candidate gives a weak or incomplete answer, ask a follow-up question.
10. Gradually increase the difficulty.
11. Keep the question natural and conversational.

Return ONLY the next interview question.
`;

  const response = await openai.responses.create({
    model: "gpt-5",
    input: prompt
  });

  return response.output_text.trim();
};
export const evaluateInterview = async ({
  resumeText,
  conversation
}) => {
  const conversationText = conversation
    .map(
      (item, index) =>
        `Question ${index + 1}: ${item.question}\nCandidate Answer: ${item.answer}`
    )
    .join("\n\n");

  const prompt = `
You are a professional interview evaluator.

Evaluate the candidate based on their resume and their complete interview.

RESUME:
${resumeText}

INTERVIEW:
${conversationText}

Evaluate:
- Technical knowledge
- Communication
- Confidence
- Problem solving
- Overall interview performance

Return ONLY valid JSON in exactly this structure:

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

All scores must be between 0 and 100.
Give practical and honest feedback.
`;

  const response = await openai.responses.create({
    model: "gpt-5",
    input: prompt
  });

  const text = response.output_text.trim();

  return JSON.parse(text);
};