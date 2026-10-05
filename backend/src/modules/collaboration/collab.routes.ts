import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { CollabRequestStatus, NotificationType } from '@prisma/client';
import { z } from 'zod';

export const collabRouter = Router();

collabRouter.use(authenticate);
collabRouter.use(requireRole('STUDENT'));

// Discover Students for Collaboration
collabRouter.get('/students', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;
    const { skill, search } = req.query;

    const students = await prisma.studentProfile.findMany({
      where: {
        id: { not: studentProfileId },
        collabProfile: { active: true },
        ...(search ? {
          OR: [
            { user: { firstName: { contains: String(search), mode: 'insensitive' } } },
            { user: { lastName: { contains: String(search), mode: 'insensitive' } } },
            { department: { contains: String(search), mode: 'insensitive' } }
          ]
        } : {}),
        ...(skill ? {
          skills: {
            some: {
              skill: { name: { contains: String(skill), mode: 'insensitive' } }
            }
          }
        } : {})
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        skills: { include: { skill: true } },
        collabProfile: true
      }
    });

    const formatted = students.map(s => ({
      id: s.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      email: s.user.email,
      avatarUrl: s.user.avatarUrl,
      department: s.department,
      semester: s.semester,
      bio: s.collabProfile?.bio,
      lookingFor: s.collabProfile?.lookingFor,
      interests: s.collabProfile?.interests,
      availabilityHoursWeekly: s.collabProfile?.availabilityHoursWeekly,
      githubUrl: s.collabProfile?.githubUrl,
      portfolioUrl: s.collabProfile?.portfolioUrl,
      skills: s.skills.map(sk => ({
        name: sk.skill.name,
        category: sk.skill.category,
        proficiency: sk.proficiencyLevel
      }))
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// Send Collaboration Request
const sendRequestSchema = z.object({
  receiverId: z.string(),
  projectId: z.string().optional(),
  message: z.string().min(5)
});

collabRouter.post('/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = sendRequestSchema.parse(req.body);
    const senderProfileId = req.user!.studentProfileId!;

    if (data.receiverId === senderProfileId) {
      return res.status(400).json({ success: false, message: 'Cannot send collaboration request to yourself.' });
    }

    const request = await prisma.collaborationRequest.create({
      data: {
        senderId: senderProfileId,
        receiverId: data.receiverId,
        projectId: data.projectId || null,
        message: data.message
      },
      include: {
        sender: { include: { user: { select: { firstName: true, lastName: true } } } },
        receiver: { include: { user: { select: { id: true, firstName: true } } } }
      }
    });

    // Create In-App Notification for Receiver
    await prisma.notification.create({
      data: {
        userId: request.receiver.user.id,
        title: '🤝 New Collaboration Request',
        message: `${request.sender.user.firstName} sent you a collaboration request: "${data.message.slice(0, 80)}..."`,
        type: NotificationType.COLLABORATION,
        actionUrl: '/collaboration'
      }
    });

    return res.status(201).json({ success: true, message: 'Collaboration request sent.', data: request });
  } catch (error) {
    next(error);
  }
});

// Get My Collaboration Requests (Sent & Received)
collabRouter.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;

    const received = await prisma.collaborationRequest.findMany({
      where: { receiverId: studentProfileId },
      include: {
        sender: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
            skills: { include: { skill: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sent = await prisma.collaborationRequest.findMany({
      where: { senderId: studentProfileId },
      include: {
        receiver: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: { received, sent } });
  } catch (error) {
    next(error);
  }
});

// Respond to Request (ACCEPT or REJECT)
collabRouter.patch('/request/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "ACCEPTED" or "REJECTED"
    const studentProfileId = req.user!.studentProfileId!;

    const request = await prisma.collaborationRequest.findFirst({
      where: { id, receiverId: studentProfileId },
      include: {
        sender: { include: { user: true } },
        receiver: { include: { user: true } }
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found or unauthorized.' });
    }

    const updated = await prisma.collaborationRequest.update({
      where: { id },
      data: { status: status as CollabRequestStatus }
    });

    // Notify sender
    await prisma.notification.create({
      data: {
        userId: request.sender.user.id,
        title: status === 'ACCEPTED' ? '🎉 Collaboration Request Accepted!' : 'Collaboration Request Update',
        message: `${request.receiver.user.firstName} ${status === 'ACCEPTED' ? 'accepted' : 'declined'} your collaboration request.`,
        type: NotificationType.COLLABORATION,
        actionUrl: '/collaboration'
      }
    });

    return res.json({ success: true, message: `Request ${status.toLowerCase()}.`, data: updated });
  } catch (error) {
    next(error);
  }
});
