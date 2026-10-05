import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { geminiService } from '../ai/gemini.service.js';

export const documentRouter = Router();

documentRouter.use(authenticate);
documentRouter.use(requireRole('STUDENT'));

// Setup Multer storage
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// Upload Document & Optionally Trigger Auto-Analysis
documentRouter.post('/upload', upload.single('document'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file was uploaded.' });
    }

    const studentProfileId = req.user!.studentProfileId!;
    const title = req.body.title || file.originalname;

    // Create AcademicDocument in DB
    const doc = await prisma.academicDocument.create({
      data: {
        studentId: studentProfileId,
        title,
        fileUrl: `/uploads/${file.filename}`,
        fileType: path.extname(file.originalname).replace('.', '') || 'pdf',
        mimeType: file.mimetype,
        fileSize: file.size,
        status: 'PENDING'
      }
    });

    // Auto-analyze via Gemini
    let analysisResult = null;
    try {
      analysisResult = await geminiService.analyzeAcademicDocument(doc.id, studentProfileId);
    } catch (analysisErr) {
      console.error('Error during auto-analysis:', analysisErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully.',
      data: {
        document: doc,
        analysis: analysisResult?.analysis || null
      }
    });
  } catch (error) {
    next(error);
  }
});

// List Student Documents
documentRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentProfileId = req.user!.studentProfileId!;

    const docs = await prisma.academicDocument.findMany({
      where: { studentId: studentProfileId },
      include: { analysis: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
});

// Manual Analyze Request
documentRouter.post('/:id/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const studentProfileId = req.user!.studentProfileId!;

    const result = await geminiService.analyzeAcademicDocument(id, studentProfileId);

    return res.json({
      success: true,
      message: 'Document analyzed and stored into persistent academic memory.',
      data: result
    });
  } catch (error) {
    next(error);
  }
});
