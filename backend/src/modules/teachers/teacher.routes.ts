import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { Priority, AttendanceStatus } from '@prisma/client';

export const teacherRouter = Router();

teacherRouter.use(authenticate);
teacherRouter.use(requireRole('TEACHER'));

// Teacher Dashboard Overview
teacherRouter.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacherProfileId = req.user!.teacherProfileId;
    if (!teacherProfileId) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        courses: {
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
            },
            attendances: {
              include: {
                records: true
              },
              orderBy: { date: 'desc' },
              take: 5
            }
          }
        }
      }
    });

    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    const courseStats = [];
    let totalUniqueStudents = new Set<string>();
    let totalClassesConducted = 0;
    let totalPresentMarks = 0;
    let totalTotalMarks = 0;
    let totalAtRiskStudentsCount = 0;

    for (const course of teacher.courses) {
      const studentIds = course.enrollments.map(e => e.studentId);
      studentIds.forEach(id => totalUniqueStudents.add(id));

      const courseAttendances = await prisma.attendance.findMany({
        where: { courseId: course.id },
        include: { records: true }
      });

      totalClassesConducted += courseAttendances.length;

      let coursePresent = 0;
      let courseTotal = 0;
      const studentAttendanceMap: Record<string, { attended: number; total: number }> = {};

      studentIds.forEach(id => {
        studentAttendanceMap[id] = { attended: 0, total: 0 };
      });

      for (const att of courseAttendances) {
        for (const rec of att.records) {
          if (studentAttendanceMap[rec.studentId]) {
            studentAttendanceMap[rec.studentId].total += 1;
            courseTotal += 1;
            totalTotalMarks += 1;
            if (rec.status === AttendanceStatus.PRESENT || rec.status === AttendanceStatus.LATE) {
              studentAttendanceMap[rec.studentId].attended += 1;
              coursePresent += 1;
              totalPresentMarks += 1;
            }
          }
        }
      }

      let atRiskInCourse = 0;
      for (const id of studentIds) {
        const stats = studentAttendanceMap[id];
        const pct = stats.total > 0 ? (stats.attended / stats.total) * 100 : 100;
        if (pct < 75) {
          atRiskInCourse += 1;
        }
      }

      totalAtRiskStudentsCount += atRiskInCourse;

      courseStats.push({
        id: course.id,
        code: course.code,
        name: course.name,
        enrolledCount: course.enrollments.length,
        classesHeld: courseAttendances.length,
        averageAttendance: courseTotal > 0 ? Math.round((coursePresent / courseTotal) * 100) : 100,
        atRiskCount: atRiskInCourse
      });
    }

    const overallAverageAttendance = totalTotalMarks > 0 ? Math.round((totalPresentMarks / totalTotalMarks) * 100) : 85;

    return res.json({
      success: true,
      data: {
        teacher: {
          name: `Dr. ${teacher.user.firstName} ${teacher.user.lastName}`,
          designation: teacher.designation,
          department: teacher.department,
          employeeId: teacher.employeeId
        },
        stats: {
          totalCourses: teacher.courses.length,
          totalStudents: totalUniqueStudents.size,
          classesConducted: totalClassesConducted,
          overallAverageAttendance,
          atRiskStudentsCount: totalAtRiskStudentsCount
        },
        courses: courseStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get Course Student List & Attendance Status
teacherRouter.get('/courses/:courseId/students', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const teacherProfileId = req.user!.teacherProfileId;

    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: teacherProfileId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } }
              }
            }
          }
        },
        attendances: {
          include: { records: true }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or unauthorized.' });
    }

    const studentList = course.enrollments.map(enr => {
      const sp = enr.student;
      let attended = 0;
      let total = 0;

      course.attendances.forEach(att => {
        const rec = att.records.find(r => r.studentId === sp.id);
        if (rec) {
          total += 1;
          if (rec.status === AttendanceStatus.PRESENT || rec.status === AttendanceStatus.LATE) {
            attended += 1;
          }
        }
      });

      const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;

      return {
        studentId: sp.id,
        rollNumber: sp.rollNumber,
        name: `${sp.user.firstName} ${sp.user.lastName}`,
        email: sp.user.email,
        avatarUrl: sp.user.avatarUrl,
        classesAttended: attended,
        totalClasses: total,
        percentage,
        isAtRisk: percentage < 75
      };
    });

    return res.json({
      success: true,
      data: {
        course: { id: course.id, code: course.code, name: course.name },
        students: studentList
      }
    });
  } catch (error) {
    next(error);
  }
});

// Post Announcement
teacherRouter.post('/announcements', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, courseId, priority, targetAudience } = req.body;
    const teacherProfileId = req.user!.teacherProfileId!;

    const announcement = await prisma.announcement.create({
      data: {
        teacherId: teacherProfileId,
        title,
        content,
        courseId: courseId || null,
        priority: (priority as Priority) || Priority.MEDIUM,
        targetAudience: targetAudience || (courseId ? 'COURSE' : 'ALL')
      }
    });

    return res.status(201).json({ success: true, message: 'Announcement posted.', data: announcement });
  } catch (error) {
    next(error);
  }
});
