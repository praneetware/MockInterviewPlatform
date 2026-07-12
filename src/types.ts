/**
 * Shared Type Definitions for AI Mock Interview Platform
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'admin';
}

export interface ResumeSummary {
  skills: string[];
  experience: string;
  suggestedRoles: string[];
  education: string;
  strengths: string[];
  gaps: string[];
}

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  type: 'question' | 'answer' | 'followup' | 'coding_prompt';
  codeSnippet?: string;
  timestamp: string;
}

export interface EvaluationMetric {
  category: string;
  score: number; // 0 to 100
  feedback: string;
}

export interface QuestionFeedback {
  question: string;
  answer: string;
  score: number; // 0 to 10
  critique: string;
  suggestion: string;
}

export interface Feedback {
  overallScore: number; // 0 to 100
  categories: {
    communication: number; // 0 to 100
    technical: number;
    problemCoding: number;
    leadership: number;
  };
  strengths: string[];
  weaknesses: string[];
  overallSummary: string;
  questionsFeedback: QuestionFeedback[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  title: string;
  role: string;
  difficulty: 'Entry' | 'Mid' | 'Senior';
  status: 'ongoing' | 'completed';
  createdAt: string;
  messages: Message[];
  codeLanguage?: string;
  codeContent?: string;
  feedback?: Feedback;
}

export interface InterviewTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Frontend' | 'Backend' | 'System Design' | 'AI / Data Science' | 'Behavioral';
  difficulty: 'Entry' | 'Mid' | 'Senior';
  questions: string[];
  codingPrompt?: {
    title: string;
    description: string;
    starterCode: {
      javascript: string;
      typescript: string;
      python: string;
    };
    testCases: Array<{
      input: string;
      expectedOutput: string;
    }>;
  };
}

export interface AnalyticsSummary {
  totalInterviews: number;
  averageScore: number;
  scoreHistory: Array<{
    date: string;
    score: number;
    title: string;
  }>;
  categoryAverages: {
    communication: number;
    technical: number;
    problemCoding: number;
    leadership: number;
  };
  byRoleBreakdown: Array<{
    role: string;
    count: number;
    avgScore: number;
  }>;
}
