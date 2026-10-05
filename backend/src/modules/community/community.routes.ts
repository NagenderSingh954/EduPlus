import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { z } from 'zod';

export const communityRouter = Router();

communityRouter.use(authenticate);

// Get Posts
communityRouter.get('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, resolved } = req.query;

    const posts = await prisma.communityPost.findMany({
      where: {
        ...(category ? { category: String(category) } : {}),
        ...(resolved !== undefined ? { isResolved: resolved === 'true' } : {}),
        ...(search ? {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { content: { contains: String(search), mode: 'insensitive' } }
          ]
        } : {})
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        answers: { select: { id: true, isAccepted: true } },
        votes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = posts.map(p => {
      const upvotes = p.votes.filter(v => v.voteType === 'UP').length;
      const downvotes = p.votes.filter(v => v.voteType === 'DOWN').length;
      return {
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
        tags: p.tags,
        views: p.views,
        isResolved: p.isResolved,
        createdAt: p.createdAt,
        author: p.author,
        answersCount: p.answers.length,
        hasAcceptedAnswer: p.answers.some(a => a.isAccepted),
        score: upvotes - downvotes
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// Get Single Post Detail
communityRouter.get('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Increment views
    await prisma.communityPost.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
        votes: true,
        answers: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
            votes: true
          },
          orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }]
        }
      }
    });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const upvotes = post.votes.filter(v => v.voteType === 'UP').length;
    const downvotes = post.votes.filter(v => v.voteType === 'DOWN').length;

    const formattedAnswers = post.answers.map(ans => {
      const aUp = ans.votes.filter(v => v.voteType === 'UP').length;
      const aDown = ans.votes.filter(v => v.voteType === 'DOWN').length;
      return {
        id: ans.id,
        content: ans.content,
        isAccepted: ans.isAccepted,
        createdAt: ans.createdAt,
        author: ans.author,
        score: aUp - aDown
      };
    });

    return res.json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        tags: post.tags,
        views: post.views,
        isResolved: post.isResolved,
        createdAt: post.createdAt,
        author: post.author,
        score: upvotes - downvotes,
        answers: formattedAnswers
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create Post
const createPostSchema = z.object({
  title: z.string().min(2, 'Question title must be at least 2 characters.'),
  content: z.string().min(3, 'Question details must be at least 3 characters.'),
  category: z.string().default('General Academic'),
  tags: z.union([z.array(z.string()), z.string()]).optional().default([])
});

communityRouter.post('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = createPostSchema.parse(req.body);
    const userId = req.user!.id;

    const parsedTags = Array.isArray(raw.tags)
      ? raw.tags
      : (typeof raw.tags === 'string' ? raw.tags.split(',').map(t => t.trim()).filter(Boolean) : []);

    const post = await prisma.communityPost.create({
      data: {
        authorId: userId,
        title: raw.title,
        content: raw.content,
        category: raw.category || 'General Academic',
        tags: parsedTags
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } }
      }
    });

    return res.status(201).json({ success: true, message: 'Doubt posted successfully!', data: post });
  } catch (error) {
    next(error);
  }
});

// Delete Post (author only)
communityRouter.delete('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.authorId !== userId) return res.status(403).json({ success: false, message: 'Unauthorized to delete this post.' });

    await prisma.communityPost.delete({ where: { id } });
    return res.json({ success: true, message: 'Doubt post deleted.' });
  } catch (error) {
    next(error);
  }
});

// Add Answer
communityRouter.post('/posts/:id/answers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Answer content must be at least 5 characters.' });
    }

    const answer = await prisma.communityAnswer.create({
      data: {
        postId: id,
        authorId: userId,
        content
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
      }
    });

    return res.status(201).json({ success: true, message: 'Answer posted.', data: answer });
  } catch (error) {
    next(error);
  }
});

// Upvote / Downvote Post
communityRouter.post('/posts/:id/vote', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // "UP" or "DOWN"
    const userId = req.user!.id;

    const existingVote = await prisma.communityVote.findFirst({
      where: { userId, postId: id, answerId: null }
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off — remove vote
        await prisma.communityVote.delete({ where: { id: existingVote.id } });
        return res.json({ success: true, message: 'Vote removed.' });
      } else {
        await prisma.communityVote.update({
          where: { id: existingVote.id },
          data: { voteType: voteType || 'UP' }
        });
      }
    } else {
      await prisma.communityVote.create({
        data: { userId, postId: id, voteType: voteType || 'UP' }
      });
    }

    return res.json({ success: true, message: 'Vote recorded.' });
  } catch (error) {
    next(error);
  }
});

// Accept Answer
communityRouter.patch('/answers/:id/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const answer = await prisma.communityAnswer.findUnique({
      where: { id },
      include: { post: true }
    });

    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found.' });
    }

    if (answer.post.authorId !== userId) {
      return res.status(403).json({ success: false, message: 'Only the question author can accept an answer.' });
    }

    // Reset others
    await prisma.communityAnswer.updateMany({
      where: { postId: answer.postId },
      data: { isAccepted: false }
    });

    const updated = await prisma.communityAnswer.update({
      where: { id },
      data: { isAccepted: true }
    });

    await prisma.communityPost.update({
      where: { id: answer.postId },
      data: { isResolved: true }
    });

    return res.json({ success: true, message: 'Answer accepted as solution.', data: updated });
  } catch (error) {
    next(error);
  }
});

// AI Pre-Check for Duplicate/Similar Discussions
communityRouter.post('/ai-precheck', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body;
    const words = (title || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

    const existingPosts = await prisma.communityPost.findMany({
      take: 10,
      include: {
        answers: { select: { id: true, isAccepted: true } }
      }
    });

    const related = existingPosts.filter(p => {
      const pTitle = p.title.toLowerCase();
      return words.some((w: string) => pTitle.includes(w));
    }).map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      answersCount: p.answers.length,
      hasAcceptedAnswer: p.answers.some(a => a.isAccepted)
    }));

    return res.json({
      success: true,
      hasRelated: related.length > 0,
      suggestedTags: words.slice(0, 3).map((w: string) => w.toUpperCase()),
      relatedDiscussions: related.slice(0, 3)
    });
  } catch (error) {
    next(error);
  }
});
