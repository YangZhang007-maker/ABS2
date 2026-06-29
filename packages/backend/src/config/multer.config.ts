import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIMES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), '..', '..', 'uploads');

export const multerConfig = {
  storage: diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      const ext = ALLOWED_MIMES[file.mimetype] || extname(file.originalname);
      const uniqueName = randomUUID() + ext;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (ALLOWED_MIMES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new BadRequestException(`不支持的文件类型: ${file.mimetype}。仅支持 PDF、Word、Excel。`), false);
    }
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
};

export { UPLOAD_DIR, ALLOWED_MIMES, MAX_FILE_SIZE };