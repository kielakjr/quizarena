import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodObject } from 'zod';

export const validate =
  (schema: ZodObject) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((issue) => issue.message);
        res.status(400).json({ message: 'Validation error', errors: messages });
        return;
      }
      next(error);
    }
  };
