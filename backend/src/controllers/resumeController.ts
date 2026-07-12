import { Request, Response } from "express";
import Resume from "../models/Resume";
import { analyzeResume } from "../services/aiService";

export const uploadResume = async (
  req: Request,
  res: Response
) => {

  try {

    const userId =
      (req as any).user.userId;

    const {
      rawText,
      skills,
      strengths,
      gaps
    } = req.body;

    const resume =
      await Resume.create({
        userId,
        rawText,
        skills,
        strengths,
        gaps
      });

    res.status(201).json(resume);

  } catch(error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

};

export const getMyResume = async (
  req: Request,
  res: Response
) => {

  try {

    const userId =
      (req as any).user.userId;

    const resumes =
      await Resume.find({
        userId
      });

    res.json(resumes);

  } catch(error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

};

export const analyzeResumeController = async (
  req: Request,
  res: Response
) => {
  try {

    const { rawText } = req.body;

    const analysis = await analyzeResume(
      rawText
    );

    res.json(
      JSON.parse(analysis!)
    );

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Resume analysis failed"
    });

  }
};