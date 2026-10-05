import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  studentProfileId?: string;
  teacherProfileId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'academiq_super_secret_jwt_key_2026_hackathon';

    const decoded = jwt.verify(token, secret) as any;
    const userId = decoded?.userId || decoded?.id;

    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ success: false, message: 'Invalid token payload: missing user ID.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: { select: { id: true } },
        teacherProfile: { select: { id: true } }
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to token no longer exists.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      studentProfileId: user.studentProfile?.id,
      teacherProfileId: user.teacherProfile?.id
    };

    next();
  } catch (error: any) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};
