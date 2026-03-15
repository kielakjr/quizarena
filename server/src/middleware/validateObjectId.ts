import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const validateObjectId =
  (param: string = 'id') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[param];
    if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
      res.status(400).json({ message: `Invalid ${param}` });
      return;
    }
    next();
  };
