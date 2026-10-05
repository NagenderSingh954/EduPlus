import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export const examRouter = Router();

examRouter.use(authenticate);

// Get All Exams & Student Results
examRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId;
    const teacherProfileId = req.user!.teacherProfileId;

    if (studentProfileId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: studentProfileId },
        select: { courseId: true }
      });
      const courseIds = enrollments.map(e => e.courseId);

      const allExams = await prisma.exam.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          course: { select: { id: true, code: true, name: true } },
          results: { where: { studentId: studentProfileId } }
        },
        orderBy: { date: 'asc' }
      });

      const now = new Date();
      const upcoming = allExams.filter(e => new Date(e.date) >= now);
      const past = allExams.filter(e => new Date(e.date) < now).map(e => ({
        ...e,
        result: e.results[0] || null
      }));

      return res.json({
        success: true,
        data: {
          upcoming,
          past
        }
      });
    } else if (teacherProfileId) {
      const exams = await prisma.exam.findMany({
        where: { course: { teacherId: teacherProfileId } },
        include: {
          course: { select: { id: true, code: true, name: true } },
          results: true
        },
        orderBy: { date: 'desc' }
      });

      return res.json({ success: true, data: exams });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

// Student Results Summary
examRouter.get('/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId;
    if (!studentProfileId) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const results = await prisma.examResult.findMany({
      where: { studentId: studentProfileId },
      include: {
        exam: {
          include: { course: { select: { code: true, name: true } } }
        }
      },
      orderBy: { exam: { date: 'desc' } }
    });

    return res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});
