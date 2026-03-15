import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({ message: 'Validation error', errors: messages });
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    message: 'Internal server error',
    ...(env.nodeEnv === 'development' && { error: err.message }),
  });
};
