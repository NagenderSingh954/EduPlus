import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { AttendanceStatus } from '@prisma/client';
import { z } from 'zod';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

// Student: View Attendance Summary with Mathematical Deficit Calculator
attendanceRouter.get('/summary', requireRole('STUDENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: studentProfileId },
      include: {
        attendance: {
          include: {
            course: true,
            teacher: { include: { user: { select: { firstName: true, lastName: true } } } }
          }
        }
      },
      orderBy: { attendance: { date: 'desc' } }
    });

    const coursesMap: Record<string, {
      courseId: string;
      code: string;
      name: string;
      credits: number;
      teacherName: string;
      total: number;
      attended: number;
      history: any[];
    }> = {};

    let grandTotal = 0;
    let grandAttended = 0;

    for (const rec of records) {
      const c = rec.attendance.course;
      if (!coursesMap[c.id]) {
        coursesMap[c.id] = {
          courseId: c.id,
          code: c.code,
          name: c.name,
          credits: c.credits,
          teacherName: `Dr. ${rec.attendance.teacher.user.firstName} ${rec.attendance.teacher.user.lastName}`,
          total: 0,
          attended: 0,
          history: []
        };
      }

      coursesMap[c.id].total += 1;
      grandTotal += 1;

      const isPresent = rec.status === AttendanceStatus.PRESENT || rec.status === AttendanceStatus.LATE;
      if (isPresent) {
        coursesMap[c.id].attended += 1;
        grandAttended += 1;
      }

      coursesMap[c.id].history.push({
        date: rec.attendance.date,
        status: rec.status,
        topicCovered: rec.attendance.topicCovered,
        remarks: rec.remarks
      });
    }

    const subjectAnalytics = Object.values(coursesMap).map(sub => {
      const percentage = sub.total > 0 ? Math.round((sub.attended / sub.total) * 100) : 100;
      const missed = sub.total - sub.attended;
      // Formula for classes needed to reach 75%:
      // (attended + X) / (total + X) >= 0.75  =>  0.25 * X >= 0.75*total - attended  =>  X >= 3*total - 4*attended
      const neededFor75 = percentage < 75 ? Math.max(0, Math.ceil(3 * sub.total - 4 * sub.attended)) : 0;
      // How many classes can I afford to miss without dropping below 75%?
      // attended / (total + Y) >= 0.75  =>  4 * attended >= 3 * (total + Y)  =>  3Y <= 4*attended - 3*total
      const canAffordToMiss = percentage >= 75 ? Math.max(0, Math.floor((4 * sub.attended - 3 * sub.total) / 3)) : 0;

      return {
        courseId: sub.courseId,
        code: sub.code,
        name: sub.name,
        credits: sub.credits,
        teacherName: sub.teacherName,
        totalClasses: sub.total,
        attendedClasses: sub.attended,
        missedClasses: missed,
        percentage,
        isAtRisk: percentage < 75,
        classesNeededFor75: neededFor75,
        canAffordToMiss,
        history: sub.history.slice(0, 5)
      };
    });

    const overallPercentage = grandTotal > 0 ? Math.round((grandAttended / grandTotal) * 100) : 100;

    return res.json({
      success: true,
      data: {
        overallPercentage,
        totalClasses: grandTotal,
        totalAttended: grandAttended,
        totalMissed: grandTotal - grandAttended,
        atRiskSubjectsCount: subjectAnalytics.filter(s => s.isAtRisk).length,
        subjects: subjectAnalytics
      }
    });
  } catch (error) {
    next(error);
  }
});

// Teacher: Get Roster / Existing Sheet for Course on Date
attendanceRouter.get('/sheet', requireRole('TEACHER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, date } = req.query;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required.' });
    }

    const teacherProfileId = req.user!.teacherProfileId!;
    const course = await prisma.course.findFirst({
      where: { id: String(courseId), teacherId: teacherProfileId },
      include: {
        classes: true,
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } }
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or unauthorized.' });
    }

    const queryDate = date ? new Date(String(date)) : new Date();
    // Normalize date to YYYY-MM-DD
    const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        courseId: String(courseId),
        date: startOfDay
      },
      include: { records: true }
    });

    const students = course.enrollments.map(enr => {
      const existingRecord = existingAttendance?.records.find(r => r.studentId === enr.studentId);
      return {
        studentId: enr.studentId,
        rollNumber: enr.student.rollNumber,
        name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
        status: existingRecord ? existingRecord.status : AttendanceStatus.PRESENT,
        remarks: existingRecord?.remarks || ''
      };
    });

    return res.json({
      success: true,
      data: {
        course: { id: course.id, code: course.code, name: course.name },
        classId: course.classes[0]?.id || '',
        date: startOfDay,
        topicCovered: existingAttendance?.topicCovered || '',
        students
      }
    });
  } catch (error) {
    next(error);
  }
});

const markAttendanceSchema = z.object({
  courseId: z.string(),
  classId: z.string().optional(),
  date: z.string(),
  topicCovered: z.string().optional(),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      remarks: z.string().optional()
    })
  )
});

// Teacher: Mark or Update Attendance
attendanceRouter.post('/mark', requireRole('TEACHER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = markAttendanceSchema.parse(req.body);
    const teacherProfileId = req.user!.teacherProfileId!;

    // Verify teacher owns the course
    const course = await prisma.course.findFirst({
      where: { id: data.courseId, teacherId: teacherProfileId },
      include: { classes: true }
    });

    if (!course) {
      return res.status(403).json({ success: false, message: 'Unauthorized to mark attendance for this course.' });
    }

    const classId = data.classId || course.classes[0]?.id;
    if (!classId) {
      return res.status(400).json({ success: false, message: 'No class section associated with this course.' });
    }

    const rawDate = new Date(data.date);
    const normalizedDate = new Date(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate());

    const result = await prisma.$transaction(async (tx) => {
      // Find or create Attendance session
      let attendance = await tx.attendance.findFirst({
        where: {
          courseId: data.courseId,
          classId,
          date: normalizedDate
        }
      });

      if (!attendance) {
        attendance = await tx.attendance.create({
          data: {
            courseId: data.courseId,
            classId,
            date: normalizedDate,
            teacherId: teacherProfileId,
            topicCovered: data.topicCovered || null
          }
        });
      } else if (data.topicCovered) {
        attendance = await tx.attendance.update({
          where: { id: attendance.id },
          data: { topicCovered: data.topicCovered }
        });
      }

      // Upsert records
      for (const rec of data.records) {
        await tx.attendanceRecord.upsert({
          where: {
            attendanceId_studentId: {
              attendanceId: attendance.id,
              studentId: rec.studentId
            }
          },
          update: {
            status: rec.status as AttendanceStatus,
            remarks: rec.remarks || null
          },
          create: {
            attendanceId: attendance.id,
            studentId: rec.studentId,
            status: rec.status as AttendanceStatus,
            remarks: rec.remarks || null
          }
        });
      }

      return attendance;
    });

    return res.json({
      success: true,
      message: `Attendance marked successfully for ${data.records.length} students.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
});
