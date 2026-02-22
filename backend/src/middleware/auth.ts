import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, error: 'No token' });
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch (error) {
    let message: string;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = 'Invalid token';
    }
    res.status(401).json({ success: false, error: message });
  }
};