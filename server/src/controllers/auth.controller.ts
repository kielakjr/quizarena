import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Username';
    res.status(409).json({ message: `${field} already taken` });
    return;
  }

  const user = await User.create({ username, email, password });
  const token = generateToken(user._id.toString());

  res.status(201).json({
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const token = generateToken(user._id.toString());

  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email },
  });
};

export const getMe = async (req: Request<unknown, unknown, { userId: string }>, res: Response): Promise<void> => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    user: { id: user._id, username: user.username, email: user.email },
  });
};
