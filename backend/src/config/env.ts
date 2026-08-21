import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: process.env.PORT || '3333',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/buywise',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3003',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
};
