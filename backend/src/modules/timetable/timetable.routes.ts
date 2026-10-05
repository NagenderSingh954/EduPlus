import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { z } from 'zod';

export const timetableRouter = Router();

timetableRouter.use(authenticate);

// GET weekly timetable (student sees their enrolled courses; teacher sees their taught courses)
timetableRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId;
    const teacherProfileId = req.user!.teacherProfileId;

    let entries: any[] = [];

    if (studentProfileId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: studentProfileId },
        select: { courseId: true }
      });
      const courseIds = enrollments.map(e => e.courseId);

      entries = await prisma.timetableEntry.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          course: {
            include: {
              teacher: {
                include: { user: { select: { firstName: true, lastName: true } } }
              }
            }
          }
        },
        orderBy: [{ startTime: 'asc' }]
      });
    } else if (teacherProfileId) {
      entries = await prisma.timetableEntry.findMany({
        where: { course: { teacherId: teacherProfileId } },
        include: { course: true },
        orderBy: [{ startTime: 'asc' }]
      });
    }

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const currentDayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date().getDay()];

    const groupedByDay: Record<string, any[]> = {};
    days.forEach(day => {
      groupedByDay[day] = entries.filter(e => e.dayOfWeek === day);
    });

    const todayLectures = entries.filter(e => e.dayOfWeek === currentDayName);

    return res.json({
      success: true,
      data: {
        currentDay: currentDayName,
        todayLectures,
        weeklyTimetable: groupedByDay
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET all available courses (for enrollment)
timetableRouter.get('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId;

    const allCourses = await prisma.course.findMany({
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { enrollments: true } }
      },
      orderBy: { code: 'asc' }
    });

    let enrolledCourseIds: string[] = [];
    if (studentProfileId) {
      const enrolled = await prisma.enrollment.findMany({
        where: { studentId: studentProfileId },
        select: { courseId: true }
      });
      enrolledCourseIds = enrolled.map(e => e.courseId);
    }

    const courses = allCourses.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      department: c.department,
      semester: c.semester,
      credits: c.credits,
      teacher: c.teacher ? `${c.teacher.user.firstName} ${c.teacher.user.lastName}` : 'TBA',
      enrolledCount: c._count.enrollments,
      isEnrolled: enrolledCourseIds.includes(c.id)
    }));

    return res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
});

// POST enroll student in a course
timetableRouter.post('/enroll/:courseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId;
    if (!studentProfileId) {
      return res.status(403).json({ success: false, message: 'Only students can enroll in courses.' });
    }

    const { courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    const existing = await prisma.enrollment.findFirst({
      where: { studentId: studentProfileId, courseId }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Already enrolled in this course.' });
    }

    // Ensure a Class record exists for this course
    let classRecord = await prisma.class.findFirst({
      where: { courseId, section: 'A' }
    });
    if (!classRecord) {
      classRecord = await prisma.class.create({
        data: { courseId, section: 'A', semester: course.semester }
      });
    }

    const enrollment = await prisma.enrollment.create({
      data: { studentId: studentProfileId, courseId, classId: classRecord.id }
    });

    return res.status(201).json({ success: true, message: `Enrolled in ${course.name}.`, data: enrollment });
  } catch (error) {
    next(error);
  }
});

// DELETE unenroll student from a course
timetableRouter.delete('/enroll/:courseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId;
    if (!studentProfileId) {
      return res.status(403).json({ success: false, message: 'Only students can unenroll from courses.' });
    }

    const { courseId } = req.params;

    await prisma.enrollment.deleteMany({
      where: { studentId: studentProfileId, courseId }
    });

    return res.json({ success: true, message: 'Unenrolled from course.' });
  } catch (error) {
    next(error);
  }
});

// GET available teachers
timetableRouter.get('/teachers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teachers = await prisma.teacherProfile.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });
    const formatted = teachers.map(t => ({
      id: t.id,
      name: `Dr. ${t.user.firstName} ${t.user.lastName}`,
      department: t.department,
      designation: t.designation
    }));
    return res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// POST add / create a new subject (course) & auto-enroll student
const createCourseSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  name: z.string().min(3),
  description: z.string().optional(),
  department: z.string().default('Computer Science & Engineering'),
  semester: z.number().min(1).max(8).default(5),
  credits: z.number().min(1).max(6).default(4),
  teacherId: z.string().optional()
});

timetableRouter.post('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCourseSchema.parse(req.body);
    const studentProfileId = req.user?.studentProfileId;

    // Resolve teacher: provided ID or first available faculty in DB
    let teacherId = data.teacherId;
    if (!teacherId) {
      const firstTeacher = await prisma.teacherProfile.findFirst();
      if (!firstTeacher) {
        return res.status(400).json({ success: false, message: 'No faculty member found in database to assign.' });
      }
      teacherId = firstTeacher.id;
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({ where: { code: data.code } });
    if (existingCourse) {
      if (studentProfileId) {
        let classRecord = await prisma.class.findFirst({ where: { courseId: existingCourse.id } });
        if (!classRecord) {
          classRecord = await prisma.class.create({
            data: { courseId: existingCourse.id, section: 'A', semester: existingCourse.semester }
          });
        }
        await prisma.enrollment.upsert({
          where: { studentId_courseId: { studentId: studentProfileId, courseId: existingCourse.id } },
          update: {},
          create: { studentId: studentProfileId, courseId: existingCourse.id, classId: classRecord.id }
        });
      }
      return res.status(200).json({ success: true, message: `Enrolled in existing subject ${existingCourse.name}.`, data: existingCourse });
    }

    // Create course
    const newCourse = await prisma.course.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || `${data.name} academic course.`,
        department: data.department,
        semester: data.semester,
        credits: data.credits,
        teacherId
      },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });

    // Create Section A class
    const classRecord = await prisma.class.create({
      data: { courseId: newCourse.id, section: 'A', semester: newCourse.semester }
    });

    // Auto-enroll student
    if (studentProfileId) {
      await prisma.enrollment.create({
        data: { studentId: studentProfileId, courseId: newCourse.id, classId: classRecord.id }
      });
    }

    return res.status(201).json({
      success: true,
      message: `Subject "${newCourse.name}" (${newCourse.code}) added successfully!`,
      data: {
        id: newCourse.id,
        code: newCourse.code,
        name: newCourse.name,
        description: newCourse.description,
        department: newCourse.department,
        semester: newCourse.semester,
        credits: newCourse.credits,
        teacher: newCourse.teacher ? `Dr. ${newCourse.teacher.user.firstName} ${newCourse.teacher.user.lastName}` : 'Faculty Assigned',
        enrolledCount: 1,
        isEnrolled: true
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST add a timetable slot (both students and teachers can add slots)
const addSlotSchema = z.object({
  courseId: z.string(),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().default('Lab 402')
});

timetableRouter.post('/slot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user?.studentProfileId;
    const teacherProfileId = req.user?.teacherProfileId;

    if (!studentProfileId && !teacherProfileId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to add timetable slots.' });
    }

    const data = addSlotSchema.parse(req.body);

    // Find or create a Timetable for the course's class
    let classRecord = await prisma.class.findFirst({ where: { courseId: data.courseId } });
    if (!classRecord) {
      const course = await prisma.course.findUnique({ where: { id: data.courseId } });
      if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
      classRecord = await prisma.class.create({
        data: { courseId: data.courseId, section: 'A', semester: course.semester }
      });
    }

    let timetable = await prisma.timetable.findUnique({ where: { classId: classRecord.id } });
    if (!timetable) {
      timetable = await prisma.timetable.create({
        data: { classId: classRecord.id, semester: classRecord.semester }
      });
    }

    const entry = await prisma.timetableEntry.create({
      data: {
        timetableId: timetable.id,
        courseId: data.courseId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room || 'Lab 402'
      },
      include: { course: true }
    });

    return res.status(201).json({ success: true, message: 'Timetable slot added.', data: entry });
  } catch (error) {
    next(error);
  }
});

// DELETE a timetable slot
timetableRouter.delete('/slot/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.timetableEntry.delete({ where: { id } });
    return res.json({ success: true, message: 'Timetable slot removed.' });
  } catch (error) {
    next(error);
  }
});



