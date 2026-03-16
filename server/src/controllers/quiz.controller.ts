import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { Quiz } from '../models/Quiz';
import { createQuizSchema, updateQuizSchema } from '../validation/quiz';
import { ZodError } from 'zod';

function collectImagePaths(quiz: { coverImage?: string; questions: { imageUrl?: string }[] }): string[] {
  const paths: string[] = [];
  if (quiz.coverImage) paths.push(quiz.coverImage);
  for (const q of quiz.questions) {
    if (q.imageUrl) paths.push(q.imageUrl);
  }
  return paths;
}

async function deleteFiles(filePaths: string[]): Promise<void> {
  const uploadsDir = path.join(__dirname, '../../uploads');
  for (const fp of filePaths) {
    const filename = fp.replace(/^\/uploads\//, '');
    const fullPath = path.join(uploadsDir, filename);
    await fs.unlink(fullPath).catch(() => {});
  }
}

function parseMultipartBody(req: Request) {
  const body = { ...req.body };

  if (typeof body.questions === 'string') {
    body.questions = JSON.parse(body.questions);
  }
  if (typeof body.isPublic === 'string') {
    body.isPublic = body.isPublic === 'true';
  }

  return body;
}

function getUploadedFiles(req: Request) {
  const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
  return {
    coverImage: files?.coverImage?.[0],
    questionImages: files?.questionImages ?? [],
  };
}

export const createQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = parseMultipartBody(req);
    const { coverImage, questionImages } = getUploadedFiles(req);

    const validated = createQuizSchema.parse(body);

    if (coverImage) {
      (validated as any).coverImage = `/uploads/${coverImage.filename}`;
    }

    if (questionImages.length > 0) {
      const imageMap: Record<string, string> = {};
      if (typeof req.body.questionImageMap === 'string') {
        Object.assign(imageMap, JSON.parse(req.body.questionImageMap));
      }

      for (const [fileIndex, file] of questionImages.entries()) {
        const questionIndex = imageMap[String(fileIndex)] ?? fileIndex;
        const qi = Number(questionIndex);
        if (validated.questions[qi]) {
          validated.questions[qi].imageUrl = `/uploads/${file.filename}`;
        }
      }
    }

    const quiz = await Quiz.create({
      ...validated,
      creator: req.userId,
    });

    res.status(201).json({ quiz });
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((issue) => issue.message);
      res.status(400).json({ message: 'Validation error', errors: messages });
      return;
    }
    if (error instanceof SyntaxError) {
      res.status(400).json({ message: 'Invalid JSON in form fields' });
      return;
    }
    throw error;
  }
};

export const getMyQuizzes = async (req: Request, res: Response): Promise<void> => {
  const quizzes = await Quiz.find({ creator: req.userId })
    .select('-questions')
    .sort({ createdAt: -1 });

  res.json({ quizzes });
};

export const getPublicQuizzes = async (_req: Request, res: Response): Promise<void> => {
  const quizzes = await Quiz.find({ isPublic: true })
    .select('-questions')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ quizzes });
};

export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  if (!quiz.isPublic && quiz.creator.toString() !== req.userId) {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  res.json({ quiz });
};

export const updateQuiz = async (req: Request, res: Response): Promise<void> => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  if (quiz.creator.toString() !== req.userId) {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  try {
    const body = parseMultipartBody(req);
    const { coverImage, questionImages } = getUploadedFiles(req);
    const oldImages: string[] = [];

    const validated = updateQuizSchema.parse(body);

    if (coverImage) {
      if (quiz.coverImage) oldImages.push(quiz.coverImage);
      (validated as any).coverImage = `/uploads/${coverImage.filename}`;
    }

    if (questionImages.length > 0 && validated.questions) {
      const imageMap: Record<string, string> = {};
      if (typeof req.body.questionImageMap === 'string') {
        Object.assign(imageMap, JSON.parse(req.body.questionImageMap));
      }

      for (const [fileIndex, file] of questionImages.entries()) {
        const questionIndex = imageMap[String(fileIndex)] ?? fileIndex;
        const qi = Number(questionIndex);
        if (validated.questions[qi]) {
          validated.questions[qi].imageUrl = `/uploads/${file.filename}`;
        }
      }
    }

    const updated = await Quiz.findByIdAndUpdate(req.params.id, validated, {
      new: true,
      runValidators: true,
    });

    if (oldImages.length > 0) {
      await deleteFiles(oldImages);
    }

    res.json({ quiz: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((issue) => issue.message);
      res.status(400).json({ message: 'Validation error', errors: messages });
      return;
    }
    if (error instanceof SyntaxError) {
      res.status(400).json({ message: 'Invalid JSON in form fields' });
      return;
    }
    throw error;
  }
};

export const deleteQuiz = async (req: Request, res: Response): Promise<void> => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return;
  }

  if (quiz.creator.toString() !== req.userId) {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  const imagePaths = collectImagePaths(quiz);
  await quiz.deleteOne();
  await deleteFiles(imagePaths);
  res.json({ message: 'Quiz deleted' });
};
