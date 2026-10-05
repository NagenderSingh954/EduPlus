import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { Priority, TaskCategory, TaskSource } from '@prisma/client';
import { z } from 'zod';

export const taskRouter = Router();

taskRouter.use(authenticate);
taskRouter.use(requireRole('STUDENT'));

// Get Student Tasks
taskRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;
    const { category, completed } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        studentId: studentProfileId,
        ...(category ? { category: category as TaskCategory } : {}),
        ...(completed !== undefined ? { completed: completed === 'true' } : {})
      },
      orderBy: [{ completed: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }]
    });

    return res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// Create Task
const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.enum(['STUDY', 'ASSIGNMENT', 'EXAM_PREP', 'PROJECT', 'PERSONAL']).default('STUDY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedMinutes: z.number().default(30),
  dueDate: z.string().optional(),
  source: z.enum(['MANUAL', 'AI_RECOMMENDED', 'AI_ONE_HOUR', 'DAILY_PLAN', 'PROJECT']).default('MANUAL')
});

taskRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const studentProfileId = req.user!.studentProfileId!;

    const task = await prisma.task.create({
      data: {
        studentId: studentProfileId,
        title: data.title,
        description: data.description || null,
        category: data.category as TaskCategory,
        priority: data.priority as Priority,
        estimatedMinutes: data.estimatedMinutes,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        source: data.source as TaskSource
      }
    });

    return res.status(201).json({ success: true, message: 'Task created.', data: task });
  } catch (error) {
    next(error);
  }
});

// Toggle Task Completion
taskRouter.patch('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const studentProfileId = req.user!.studentProfileId!;

    const task = await prisma.task.findFirst({
      where: { id, studentId: studentProfileId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : null
      }
    });

    return res.json({ success: true, message: 'Task updated.', data: updated });
  } catch (error) {
    next(error);
  }
});

// Delete Task
taskRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const studentProfileId = req.user!.studentProfileId!;

    await prisma.task.deleteMany({
      where: { id, studentId: studentProfileId }
    });

    return res.json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    next(error);
  }
});

// Start Active Study Session
taskRouter.post('/study-session/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;
    const { title, targetMinutes, subject, topics } = req.body;

    const session = await prisma.studySession.create({
      data: {
        studentId: studentProfileId,
        title: title || 'Deep Study Session',
        targetMinutes: targetMinutes || 60,
        subject: subject || 'General Study',
        topics: topics || []
      }
    });

    return res.status(201).json({ success: true, message: 'Study session started.', data: session });
  } catch (error) {
    next(error);
  }
});

// Complete Study Session
taskRouter.post('/study-session/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { actualMinutes, completedTasks } = req.body;
    const studentProfileId = req.user!.studentProfileId!;

    const session = await prisma.studySession.updateMany({
      where: { id, studentId: studentProfileId },
      data: {
        status: 'COMPLETED',
        actualMinutes: actualMinutes || 60,
        completedTasks: completedTasks || [],
        completedAt: new Date()
      }
    });

    return res.json({ success: true, message: 'Study session completed. Consistency score boosted!' });
  } catch (error) {
    next(error);
  }
});
