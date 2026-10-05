import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { Role } from '@prisma/client';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  employeeId: z.string().optional(),
  designation: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const generateTokens = (user: { id: string; email: string; role: Role }) => {
  const jwtSecret = process.env.JWT_SECRET || 'academiq_super_secret_jwt_key_2026_hackathon';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'academiq_super_refresh_jwt_key_2026_hackathon';

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    refreshSecret,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// Register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role as Role,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.firstName}`,
        ...(data.role === 'STUDENT'
          ? {
              studentProfile: {
                create: {
                  rollNumber: data.rollNumber || `ST-${Math.floor(1000 + Math.random() * 9000)}`,
                  department: data.department || 'Computer Science & Engineering',
                  semester: 5,
                  collabProfile: {
                    create: {
                      bio: `Hello, I'm ${data.firstName}! Passionate about technology and collaborative projects.`,
                      lookingFor: 'Project partners and study buddies'
                    }
                  }
                }
              }
            }
          : data.role === 'TEACHER'
          ? {
              teacherProfile: {
                create: {
                  employeeId: data.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
                  department: data.department || 'Computer Science & Engineering',
                  designation: data.designation || 'Assistant Professor'
                }
              }
            }
          : {})
      },
      include: {
        studentProfile: true,
        teacherProfile: true
      }
    });

    if (user.role === 'STUDENT' && user.studentProfile) {
      try {
        const availableCourses = await prisma.course.findMany({
          where: {
            OR: [
              { department: user.studentProfile.department },
              { semester: user.studentProfile.semester }
            ]
          },
          include: { classes: { take: 1 } },
          take: 5
        });

        const validEnrollments = availableCourses
          .filter(c => c.classes && c.classes.length > 0)
          .map(c => ({
            studentId: user.studentProfile!.id,
            courseId: c.id,
            classId: c.classes[0].id
          }));

        if (validEnrollments.length > 0) {
          await prisma.enrollment.createMany({
            data: validEnrollments,
            skipDuplicates: true
          });
        }
      } catch (enrollErr) {
        console.warn('⚠️ Auto-enrollment for new student non-fatal error:', enrollErr);
      }
    }

    const tokens = generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          studentProfile: user.studentProfile,
          teacherProfile: user.teacherProfile
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        teacherProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const tokens = generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          studentProfile: user.studentProfile,
          teacherProfile: user.teacherProfile
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get Current Authenticated User Profile
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        studentProfile: {
          include: {
            skills: { include: { skill: true } },
            collabProfile: true
          }
        },
        teacherProfile: true
      }
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});
