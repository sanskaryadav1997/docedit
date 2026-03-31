import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'docedit-secret-key-dev';

export interface AuthRequest extends Request {
  userId?: string;
}

export function signToken(userId
