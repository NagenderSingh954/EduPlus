import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { Priority, ProjectRole, ProjectStatus, ProjectTaskStatus } from '@prisma/client';
import { z } from 'zod';

export const projectRouter = Router();

projectRouter.use(authenticate);
projectRouter.use(requireRole('STUDENT'));

// Get All Projects for Student
projectRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: studentProfileId },
          { members: { some: { studentId: studentProfileId } } }
        ]
      },
      include: {
        creator: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        members: {
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } }
          }
        },
        milestones: true,
        tasks: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = projects.map(p => {
      const totalTasks = p.tasks.length;
      const doneTasks = p.tasks.filter(t => t.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        githubUrl: p.githubUrl,
        demoUrl: p.demoUrl,
        progress,
        totalTasks,
        doneTasks,
        membersCount: p.members.length,
        creator: p.creator,
        members: p.members
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// Get Project Detail with Kanban Board & Milestones
projectRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const studentProfileId = req.user!.studentProfileId!;

    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { creatorId: studentProfileId },
          { members: { some: { studentId: studentProfileId } } }
        ]
      },
      include: {
        creator: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        members: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
                skills: { include: { skill: true } }
              }
            }
          }
        },
        milestones: {
          include: { tasks: true },
          orderBy: { order: 'asc' }
        },
        tasks: {
          include: {
            assignedTo: {
              include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } }
            },
            milestone: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or unauthorized.' });
    }

    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter(t => t.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Group tasks into Kanban columns
    const kanban = {
      TODO: project.tasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: project.tasks.filter(t => t.status === 'IN_PROGRESS'),
      IN_REVIEW: project.tasks.filter(t => t.status === 'IN_REVIEW'),
      DONE: project.tasks.filter(t => t.status === 'DONE')
    };

    return res.json({
      success: true,
      data: {
        ...project,
        progress,
        kanban
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create Task in Project
const createProjectTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  milestoneId: z.string().optional(),
  assignedToId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional()
});

projectRouter.post('/:id/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = createProjectTaskSchema.parse(req.body);

    const task = await prisma.projectTask.create({
      data: {
        projectId: id,
        title: data.title,
        description: data.description || null,
        milestoneId: data.milestoneId || null,
        assignedToId: data.assignedToId || null,
        status: data.status as ProjectTaskStatus,
        priority: data.priority as Priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      }
    });

    return res.status(201).json({ success: true, message: 'Project task created.', data: task });
  } catch (error) {
    next(error);
  }
});

// Update Project Task Status
projectRouter.patch('/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const { status, assignedToId } = req.body;

    const task = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        ...(status ? { status: status as ProjectTaskStatus } : {}),
        ...(assignedToId !== undefined ? { assignedToId } : {})
      }
    });

    return res.json({ success: true, message: 'Task updated.', data: task });
  } catch (error) {
    next(error);
  }
});

// AI Project Assistant (Grounded in real project state)
projectRouter.post('/:id/ai-assist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: { include: { student: { include: { user: true } } } },
        milestones: { include: { tasks: true } },
        tasks: { include: { assignedTo: { include: { user: true } } } }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const lower = (question || '').toLowerCase();
    let advice = '';

    const pendingTasks = project.tasks.filter(t => t.status !== 'DONE');
    const inProgress = project.tasks.filter(t => t.status === 'IN_PROGRESS');

    if (lower.includes('next') || lower.includes('work on')) {
      const topTask = inProgress[0] || pendingTasks[0];
      advice = topTask
        ? `Based on your project roadmap, you should focus on **"${topTask.title}"** (Priority: ${topTask.priority}). It is part of the active sprint and assigned to ${topTask.assignedTo?.user.firstName || 'the team'}.`
        : `All current project tasks are marked DONE! Review Milestone progress and generate the next sprint backlog.`;
    } else if (lower.includes('block') || lower.includes('risk')) {
      const unassigned = pendingTasks.filter(t => !t.assignedToId);
      advice = unassigned.length > 0
        ? `⚠️ **Identified Bottleneck**: There are ${unassigned.length} unassigned tasks in the backlog, including "${unassigned[0].title}". Assign these tasks to maintain team velocity.`
        : `Currently, all ${pendingTasks.length} pending tasks are assigned and progressing steadily across milestones.`;
    } else {
      advice = `Project **"${project.title}"** is currently at **${Math.round((project.tasks.filter(t => t.status === 'DONE').length / Math.max(1, project.tasks.length)) * 100)}% completion**. 
- Active Milestones: ${project.milestones.filter(m => !m.completed).length} remaining.
- Tasks in Progress: ${inProgress.length}.
Let me know if you want me to generate new tasks or suggest role assignments!`;
    }

    return res.json({
      success: true,
      data: {
        question,
        advice
      }
    });
  } catch (error) {
    next(error);
  }
});
