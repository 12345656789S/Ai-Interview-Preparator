import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateInterviewQuestions(resumeText) {

  const prompt = `
You are an expert technical interviewer.

Analyze the following candidate resume.

Create personalized interview questions based ONLY on the candidate's resume.

Include:

1. HR questions
2. Technical questions
3. Project questions
4. Skill-based questions
5. Follow-up questions

The questions should feel like a real software developer interview.

Resume:

${resumeText}

Return 15 concise questions.
`;

  const response = await client.responses.create({
    model: "gpt-5.6-luna",
    input: prompt
  });

  return response.output_text;
}


export async function evaluateAnswer(
  resumeText,
  question,
  answer
) {

  const prompt = `
You are an AI interview evaluator.

Candidate Resume:
${resumeText}

Interview Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer.

Give:

Score out of 10
What was good
What was missing
How to improve
A better sample answer

Keep the feedback practical and concise.
`;

  const response = await client.responses.create({
    model: "gpt-5.6-luna",
    input: prompt
  });

  return response.output_text;
}