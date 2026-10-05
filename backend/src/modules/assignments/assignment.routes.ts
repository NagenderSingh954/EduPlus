import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { AssignmentStatus } from '@prisma/client';
import { z } from 'zod';

export const assignmentRouter = Router();

assignmentRouter.use(authenticate);

// Get Assignments for Student or Teacher
assignmentRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isStudent = req.user!.role === 'STUDENT';
    const studentProfileId = req.user!.studentProfileId;
    const teacherProfileId = req.user!.teacherProfileId;

    if (isStudent && studentProfileId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: studentProfileId },
        select: { courseId: true }
      });
      const courseIds = enrollments.map(e => e.courseId);

      const assignments = await prisma.assignment.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          course: { select: { id: true, code: true, name: true } },
          submissions: {
            where: { studentId: studentProfileId }
          }
        },
        orderBy: { dueDate: 'asc' }
      });

      const formatted = assignments.map(a => {
        const submission = a.submissions[0] || null;
        const isLate = !submission && new Date() > a.dueDate;
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          course: a.course,
          maxMarks: a.maxMarks,
          dueDate: a.dueDate,
          fileUrl: a.fileUrl,
          submission: submission ? {
            id: submission.id,
            submittedAt: submission.submittedAt,
            fileUrl: submission.fileUrl,
            marksObtained: submission.marksObtained,
            feedback: submission.feedback,
            status: submission.status
          } : null,
          status: submission ? submission.status : (isLate ? 'LATE' : 'PENDING')
        };
      });

      return res.json({ success: true, data: formatted });
    } else if (teacherProfileId) {
      const assignments = await prisma.assignment.findMany({
        where: { course: { teacherId: teacherProfileId } },
        include: {
          course: { select: { id: true, code: true, name: true } },
          submissions: {
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } }
                }
              }
            }
          }
        },
        orderBy: { dueDate: 'desc' }
      });

      return res.json({ success: true, data: assignments });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

// Student: Submit Assignment
assignmentRouter.post('/:id/submit', requireRole('STUDENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { fileUrl } = req.body;
    const studentProfileId = req.user!.studentProfileId!;

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const isLate = new Date() > assignment.dueDate;

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId: studentProfileId
        }
      },
      update: {
        fileUrl: fileUrl || 'https://example.com/submission-file.pdf',
        submittedAt: new Date(),
        status: isLate ? AssignmentStatus.LATE : AssignmentStatus.SUBMITTED
      },
      create: {
        assignmentId: id,
        studentId: studentProfileId,
        fileUrl: fileUrl || 'https://example.com/submission-file.pdf',
        submittedAt: new Date(),
        status: isLate ? AssignmentStatus.LATE : AssignmentStatus.SUBMITTED
      }
    });

    return res.json({ success: true, message: 'Assignment submitted successfully.', data: submission });
  } catch (error) {
    next(error);
  }
});

// Teacher: Create Assignment
const createAssignmentSchema = z.object({
  courseId: z.string(),
  title: z.string().min(3),
  description: z.string(),
  maxMarks: z.number().default(100),
  dueDate: z.string()
});

assignmentRouter.post('/', requireRole('TEACHER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createAssignmentSchema.parse(req.body);
    const teacherProfileId = req.user!.teacherProfileId!;

    const course = await prisma.course.findFirst({
      where: { id: data.courseId, teacherId: teacherProfileId }
    });

    if (!course) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this course.' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        maxMarks: data.maxMarks,
        dueDate: new Date(data.dueDate)
      }
    });

    return res.status(201).json({ success: true, message: 'Assignment created.', data: assignment });
  } catch (error) {
    next(error);
  }
});
