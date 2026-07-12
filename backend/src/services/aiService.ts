import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

export default openai;

export async function analyzeResume(
  resumeText: string
) {

  const completion =
    await openai.chat.completions.create({

      model:
      "deepseek/deepseek-chat-v3-0324",

      messages: [
        {
          role: "system",
          content:
          `You are an expert recruiter.

Return ONLY JSON.

{
  "skills": [],
  "strengths": [],
  "gaps": [],
  "suggestedRoles": []
}`
        },

        {
          role: "user",
          content: resumeText
        }
      ]
    });

  return completion
    .choices[0]
    .message
    .content;
}

export async function generateInterviewReply(
  messages: any[]
) {

  const completion =
    await openai.chat.completions.create({

      model:
      "deepseek/deepseek-chat-v3-0324",

      messages: [
        {
          role: "system",
          content: `
You are a professional technical interviewer.

Rules:
- Ask one question at a time.
- Wait for the candidate response.
- Keep the interview conversational.
- Ask technical questions.
- Do not reveal answers.
- Keep responses under 150 words.
`
        },

        ...messages
      ]
    });

  return completion
    .choices[0]
    .message
    .content;
}


export async function evaluateInterview(
  transcript: string
) {

  const completion =
    await openai.chat.completions.create({

      model:
      "deepseek/deepseek-chat-v3-0324",

      messages: [
        {
          role: "system",
          content: `
Return ONLY JSON.

{
  "overallScore": 0,
  "communication": 0,
  "technical": 0,
  "problemSolving": 0,
  "strengths": [],
  "weaknesses": [],
  "summary": ""
}
`
        },

        {
          role: "user",
          content: transcript
        }
      ]
    });

  return completion
    .choices[0]
    .message
    .content;
}