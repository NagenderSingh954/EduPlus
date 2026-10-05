import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { geminiService } from './gemini.service.js';
import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';

export const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(requireRole('STUDENT'));

// Helper to get or ensure studentProfileId
async function resolveStudentProfileId(req: Request): Promise<string> {
  if (req.user?.studentProfileId) return req.user.studentProfileId;
  const userId = req.user!.id;
  let profile = await prisma.studentProfile.findFirst({ where: { userId } });
  if (!profile) {
    profile = await prisma.studentProfile.create({
      data: {
        userId,
        rollNumber: `ST-${Date.now().toString().slice(-4)}`,
        department: 'Computer Science & Engineering',
        semester: 5
      }
    });
  }
  if (req.user) req.user.studentProfileId = profile.id;
  return profile.id;
}

// GET chat history (last 100 messages)
aiRouter.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = await resolveStudentProfileId(req);
    const messages = await prisma.chatMessage.findMany({
      where: { studentId: studentProfileId },
      orderBy: { createdAt: 'asc' },
      take: 100
    });
    return res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
});

// DELETE (clear) chat history
aiRouter.delete('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = await resolveStudentProfileId(req);
    await prisma.chatMessage.deleteMany({ where: { studentId: studentProfileId } });
    return res.json({ success: true, message: 'Chat history cleared.' });
  } catch (error) {
    next(error);
  }
});

// Chat with Gemini & Tools (grounded on student context & uploaded documents)
const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({ role: z.enum(['user', 'model']), parts: z.string() })).default([]),
  documentId: z.string().optional()
});

aiRouter.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history, documentId } = chatSchema.parse(req.body);
    const studentProfileId = await resolveStudentProfileId(req);

    const result = await geminiService.chatWithGemini(studentProfileId, message, history, documentId);

    // Persist both the user message and the AI reply to DB
    try {
      await prisma.chatMessage.createMany({
        data: [
          {
            studentId: studentProfileId,
            role: 'user',
            content: message,
            documentId: documentId || null
          },
          {
            studentId: studentProfileId,
            role: 'model',
            content: result.reply,
            executedAction: result.executedAction ? JSON.parse(JSON.stringify(result.executedAction)) : null,
            contextUsed: result.contextUsed ? JSON.parse(JSON.stringify(result.contextUsed)) : null,
            documentId: documentId || null
          }
        ]
      });
    } catch (saveErr) {
      console.warn('⚠️ Could not persist chat messages to DB:', saveErr);
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// "I Have 1 Hour" Solver
const oneHourSchema = z.object({
  minutes: z.number().min(15).max(180).default(60)
});

aiRouter.post('/one-hour', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { minutes } = oneHourSchema.parse(req.body);
    const studentProfileId = req.user!.studentProfileId!;

    const result = await geminiService.generateOneHourSession(studentProfileId, minutes);

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// AI Team Matcher
const matchTeamSchema = z.object({
  concept: z.string().min(3)
});

aiRouter.post('/match-team', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { concept } = matchTeamSchema.parse(req.body);
    const studentProfileId = req.user!.studentProfileId!;

    const result = await geminiService.matchTeamForProject(concept, studentProfileId);

    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// AI Project Generation
const generateProjectSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5)
});

aiRouter.post('/generate-project', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description } = generateProjectSchema.parse(req.body);
    const studentProfileId = req.user!.studentProfileId!;

    const project = await geminiService.generateProjectStructure(title, description, studentProfileId);

    return res.status(201).json({ success: true, message: 'Project and tasks generated.', data: project });
  } catch (error) {
    next(error);
  }
});
