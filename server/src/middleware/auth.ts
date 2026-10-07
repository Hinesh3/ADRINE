import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'adrine-clinic-super-secret-jwt-key-2025';

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  role: 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN';
  doctorId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    
    // Attach fresh doctorId if user is DOCTOR
    if (decoded.role === 'DOCTOR' && !decoded.doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: decoded.id },
      });
      if (doctor) {
        decoded.doctorId = doctor.id;
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
};

export const requireRoles = (allowedRoles: Array<'RECEPTIONIST' | 'DOCTOR' | 'ADMIN'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
};
