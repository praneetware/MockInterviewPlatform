import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({
      email
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    return res.status(201).json(user);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error"
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({
      email
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d"
      }
    );

    return res.status(200).json({
      token,
      user
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Server Error"
    });

  }
};

export const getMe = async (
  req: Request,
  res: Response
) => {

  try {

    const userId =
      (req as any).user.userId;

    const user =
      await User.findById(userId)
      .select("-password");

    res.json(user);

  } catch(error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

};