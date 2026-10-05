import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { AttendanceStatus, AssignmentStatus } from '@prisma/client';

export const studentRouter = Router();

studentRouter.use(authenticate);

// Student Dashboard Aggregation
studentRouter.get('/dashboard', requireRole('STUDENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId;
    if (!studentProfileId) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // 1. Attendance Analytics
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: studentProfileId },
      include: {
        attendance: {
          include: { course: true }
        }
      }
    });

    const courseAttendanceMap: Record<string, { code: string; name: string; total: number; attended: number }> = {};
    let totalClasses = 0;
    let totalAttended = 0;

    for (const record of attendanceRecords) {
      const course = record.attendance.course;
      if (!courseAttendanceMap[course.id]) {
        courseAttendanceMap[course.id] = {
          code: course.code,
          name: course.name,
          total: 0,
          attended: 0
        };
      }
      courseAttendanceMap[course.id].total += 1;
      totalClasses += 1;
      if (record.status === AttendanceStatus.PRESENT || record.status === AttendanceStatus.LATE) {
        courseAttendanceMap[course.id].attended += 1;
        totalAttended += 1;
      }
    }

    const subjectAttendance = Object.values(courseAttendanceMap).map(c => {
      const percentage = c.total > 0 ? Math.round((c.attended / c.total) * 100) : 100;
      // Calculate deficit: how many more classes to attend to reach 75%?
      // (attended + x) / (total + x) >= 0.75  =>  x >= (0.75*total - attended) / 0.25 = 3*total - 4*attended
      const neededFor75 = percentage < 75 ? Math.max(0, Math.ceil(3 * c.total - 4 * c.attended)) : 0;
      return {
        code: c.code,
        name: c.name,
        total: c.total,
        attended: c.attended,
        missed: c.total - c.attended,
        percentage,
        isAtRisk: percentage < 75,
        classesNeededFor75: neededFor75
      };
    });

    const overallAttendancePercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 85;

    // 2. Exam Performance
    const examResults = await prisma.examResult.findMany({
      where: { studentId: studentProfileId },
      include: { exam: { include: { course: true } } },
      orderBy: { createdAt: 'desc' }
    });

    let totalMarks = 0;
    let maxPossibleMarks = 0;
    examResults.forEach(r => {
      totalMarks += r.marksObtained;
      maxPossibleMarks += r.exam.maxMarks;
    });

    const averageExamScore = maxPossibleMarks > 0 ? Math.round((totalMarks / maxPossibleMarks) * 100) : 75;

    // 3. Assignments Pending & Submissions
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: studentProfileId },
      select: { courseId: true }
    });
    const courseIds = enrollments.map(e => e.courseId);

    const activeAssignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: { select: { code: true, name: true } },
        submissions: { where: { studentId: studentProfileId } }
      },
      orderBy: { dueDate: 'asc' }
    });

    const pendingAssignments = activeAssignments.filter(a => a.submissions.length === 0);

    // 4. Upcoming Exams
    const upcomingExams = await prisma.exam.findMany({
      where: {
        courseId: { in: courseIds },
        date: { gte: new Date() }
      },
      include: { course: { select: { code: true, name: true } } },
      orderBy: { date: 'asc' }
    });

    // 5. Today's Timetable
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = days[new Date().getDay()];

    const timetableEntries = await prisma.timetableEntry.findMany({
      where: {
        dayOfWeek: currentDay,
        courseId: { in: courseIds }
      },
      include: { course: true },
      orderBy: { startTime: 'asc' }
    });

    // 6. Transparent Academic Health Score Calculation (0 - 100)
    // Performance: 30%
    const perfScore = averageExamScore;
    // Attendance: 25% (with penalty if any course < 75%)
    const atRiskCount = subjectAttendance.filter(s => s.isAtRisk).length;
    const attPenalty = atRiskCount * 8;
    const attScore = Math.max(0, overallAttendancePercentage - attPenalty);
    // Assignment completion: 20%
    const totalAssign = activeAssignments.length;
    const submittedAssign = totalAssign - pendingAssignments.length;
    const assignScore = totalAssign > 0 ? Math.round((submittedAssign / totalAssign) * 100) : 90;
    // Exam Readiness: 15%
    const examReadinessScore = upcomingExams.length > 0 ? 75 : 90;
    // Consistency: 10%
    const consistencyScore = 80;

    const academicHealthScore = Math.min(100, Math.max(0, Math.round(
      0.30 * perfScore +
      0.25 * attScore +
      0.20 * assignScore +
      0.15 * examReadinessScore +
      0.10 * consistencyScore
    )));

    // 7. Student Tasks
    const tasks = await prisma.task.findMany({
      where: { studentId: studentProfileId },
      orderBy: [{ completed: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      take: 6
    });

    // 8. Active Study Session if any
    const activeStudySession = await prisma.studySession.findFirst({
      where: { studentId: studentProfileId, status: 'ACTIVE' },
      orderBy: { startedAt: 'desc' }
    });

    // 9. Recent Announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetAudience: 'ALL' },
          { courseId: { in: courseIds } }
        ]
      },
      include: { teacher: { include: { user: { select: { firstName: true, lastName: true } } } }, course: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    return res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
          avatarUrl: student.user.avatarUrl,
          rollNumber: student.rollNumber,
          department: student.department,
          semester: student.semester,
          gpa: student.gpa,
          strengths: student.strengths,
          weaknesses: student.weaknesses,
          currentGoals: student.currentGoals,
          upcomingPriorities: student.upcomingPriorities
        },
        overview: {
          overallAttendance: overallAttendancePercentage,
          averageExamScore,
          gpa: student.gpa,
          pendingAssignmentsCount: pendingAssignments.length,
          upcomingExamsCount: upcomingExams.length,
          academicHealthScore
        },
        healthBreakdown: {
          overall: academicHealthScore,
          performance: { score: perfScore, weight: '30%' },
          attendance: { score: attScore, weight: '25%', atRiskCourses: atRiskCount },
          assignmentCompletion: { score: assignScore, weight: '20%' },
          examReadiness: { score: examReadinessScore, weight: '15%' },
          consistency: { score: consistencyScore, weight: '10%' }
        },
        subjectAttendance,
        todayClasses: timetableEntries,
        pendingAssignments,
        upcomingExams,
        tasks,
        activeStudySession,
        announcements
      }
    });
  } catch (error) {
    next(error);
  }
});

// Student Profile Detail
studentRouter.get('/profile', requireRole('STUDENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: req.user!.studentProfileId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
        skills: { include: { skill: true } },
        collabProfile: true,
        examResults: { include: { exam: { include: { course: true } } } }
      }
    });

    return res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
});

// Update Profile
studentRouter.patch('/profile', requireRole('STUDENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentGoals, learningPreferences, upcomingPriorities } = req.body;

    const updated = await prisma.studentProfile.update({
      where: { id: req.user!.studentProfileId },
      data: {
        ...(currentGoals ? { currentGoals } : {}),
        ...(learningPreferences ? { learningPreferences } : {}),
        ...(upcomingPriorities ? { upcomingPriorities } : {}),
        lastUpdated: new Date()
      }
    });

    return res.json({ success: true, message: 'Academic profile updated.', data: updated });
  } catch (error) {
    next(error);
  }
});
