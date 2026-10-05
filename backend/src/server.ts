import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { studentRouter } from './modules/students/student.routes.js';
import { teacherRouter } from './modules/teachers/teacher.routes.js';
import { attendanceRouter } from './modules/attendance/attendance.routes.js';
import { assignmentRouter } from './modules/assignments/assignment.routes.js';
import { timetableRouter } from './modules/timetable/timetable.routes.js';
import { examRouter } from './modules/exams/exam.routes.js';
import { documentRouter } from './modules/documents/document.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { taskRouter } from './modules/tasks/task.routes.js';
import { communityRouter } from './modules/community/community.routes.js';
import { collabRouter } from './modules/collaboration/collab.routes.js';
import { projectRouter } from './modules/projects/project.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { scheduleDailyPlanJob } from './jobs/queue.service.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'AcademiQ Academic OS',
    timestamp: new Date().toISOString(),
    postgres: 'connected',
    redis: 'ready'
  });
});

// Trigger Daily Plan Background Job (Manual or Scheduled webhook)
app.post('/api/jobs/trigger-daily-plan', async (req, res, next) => {
  try {
    const studentProfileId = req.body.studentProfileId;
    const result = await scheduleDailyPlanJob(studentProfileId);
    res.json({ success: true, message: 'Daily plan job dispatched.', data: result });
  } catch (error) {
    next(error);
  }
});

// Register Modules
app.use('/api/auth', authRouter);
app.use('/api/students', studentRouter);
app.use('/api/teachers', teacherRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/assignments', assignmentRouter);
app.use('/api/timetable', timetableRouter);
app.use('/api/exams', examRouter);
app.use('/api/documents', documentRouter);
app.use('/api/ai', aiRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/community', communityRouter);
app.use('/api/collaboration', collabRouter);
app.use('/api/projects', projectRouter);
app.use('/api/notifications', notificationRouter);

// Centralized Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 [AcademiQ Backend] Running on http://localhost:${PORT}`);
  console.log(`📚 Database: PostgreSQL 18 on port 5433`);
  console.log(`🤖 Intelligence: Google Gemini SDK & Tool-Calling Engine`);
});
