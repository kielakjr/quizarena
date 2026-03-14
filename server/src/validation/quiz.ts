import { z } from 'zod';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  imageUrl: z.string().optional(),
  options: z
    .array(optionSchema)
    .length(4, 'Each question must have exactly 4 options')
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      'Each question must have exactly 1 correct answer'
    ),
  timeLimit: z.number().min(5).max(60).optional().default(20),
  points: z.number().min(100).max(2000).optional().default(1000),
});

const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional().default(''),
  isPublic: z.boolean().optional().default(true),
  questions: z
    .array(questionSchema)
    .min(1, 'Quiz must have at least 1 question'),
});

const updateQuizSchema = createQuizSchema.partial();

export { createQuizSchema, updateQuizSchema };
