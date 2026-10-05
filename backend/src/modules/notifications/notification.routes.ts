import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return res.json({
      success: true,
      data: {
        unreadCount,
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
});

notificationRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

notificationRouter.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId },
      data: { read: true }
    });

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});
