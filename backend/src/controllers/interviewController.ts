import { Request, Response } from "express";
import Interview from "../models/Interview";
import Template from "../models/Template";

export const createInterview = async (
  req: Request,
  res: Response
) => {
  try {

    const userId =
      (req as any).user.userId;

    const { templateId } = req.body;

    const templates = {
      "frontend-react": "Frontend Engineer (React & UX)",
      "backend-node": "Senior Backend Engineer (Node & System)",
      "system-design": "System Design: Scalable Push Notifications",
      "behavioral-star": "Behavioral Excellence (STAR Framework)"
    };

    const title =
      templates[templateId as keyof typeof templates] ||
      "Mock Interview";

    const interview =
      await Interview.create({
        userId,
        title,
        messages: []
      });

    res.status(201).json({
      id: interview._id,
      role: interview.title,
      status: interview.status,
      messages: [],
      codeContent: ""
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};

import { generateInterviewReply }
from "../services/aiService";

export const sendMessage = async (
  req: Request,
  res: Response
) => {

  try {

    const interviewId =
      req.body.interviewId;

    const text =
      req.body.text;

    const codeContent =
      req.body.codeContent;

    const interview =
      await Interview.findById(
        interviewId
      );

    if (!interview) {

      return res.status(404).json({
        message: "Interview not found"
      });

    }

    interview.messages.push({
      role: "user",
      content: text
    });

    const aiReply =
      await generateInterviewReply(
        interview.messages
      );

    interview.messages.push({
      role: "assistant",
      content: aiReply
    });

    if (codeContent) {
      (interview as any).codeContent =
        codeContent;
    }

    await interview.save();

    res.json({
      session: {
        id: interview._id,
        role: interview.title,
        status: interview.status,
        messages: interview.messages.map((m: any) => ({
          id: m._id?.toString() || Date.now().toString(),
          sender: m.role === "assistant" ? "ai" : "user",
          text: m.content,
          timestamp: m.timestamp || new Date().toISOString()
        })),
        codeContent: ""
      },
      complete: false
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

};


import {
  evaluateInterview
}
from "../services/aiService";

export const finishInterview =
async (
  req: Request,
  res: Response
) => {

  try {

    const { interviewId } = req.body;

    const interview =
      await Interview.findById(
        interviewId
      );

    if (!interview) {

      return res.status(404).json({
        message: "Interview not found"
      });

    }

    const transcript =
      interview.messages
      .map(
        (m: any) =>
        `${m.role}: ${m.content}`
      )
      .join("\n");

    const analysis =
      await evaluateInterview(
        transcript
      );

    const cleanedResponse = analysis!
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    interview.feedback =
    JSON.parse(cleanedResponse);

    interview.status =
      "completed";

    await interview.save();

    res.json({
      message:
      "Interview completed",

      feedback:
      interview.feedback
    });

  } catch(error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};

export const sendMessageById = async (
  req: Request,
  res: Response
) => {

  req.body.interviewId = req.params.id;

  return sendMessage(req, res);
};

export const endInterview = async (
  req: Request,
  res: Response
) => {

  try {

    const interview =
      await Interview.findById(
        req.params.id
      );

    if (!interview) {

      return res.status(404).json({
        message: "Not found"
      });

    }

    interview.status = "completed";

    await interview.save();

    res.json({
      id: interview._id,
      role: interview.title,
      status: interview.status,
      messages: interview.messages,
      feedback: interview.feedback || null,
      codeContent:
        (interview as any).codeContent || ""
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

};

export const getHistory =
async (req,res) => {

  const userId =
  (req as any).user.id;

  const interviews =
  await Interview.find({
    user:userId
  });

  res.json({
    sessions: interviews.map(i => ({
      id: i._id,
      role: i.title,
      status: i.status,

      messages: i.messages.map((m: any) => ({
        id: m._id?.toString(),
        sender: m.role === "assistant" ? "ai" : "user",
        text: m.content,
        timestamp: m.timestamp || new Date().toISOString()
      })),

      feedback: i.feedback,
      codeContent: ""
    }))
  });

};