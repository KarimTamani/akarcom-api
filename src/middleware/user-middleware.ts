import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import prisma from '../../prisma/prisma';
import { User } from '../lib/user';


interface JwtPayload {
    id: string;
    email: string;
    // Add any other fields your JWT might contain
    [key: string]: any;
}

// Extend the Express Request type to include `user`
export interface UserRequest extends Request {
    user?: User;
}

export const UserMiddleware = async (req: UserRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // 1. Check for Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.split(' ')[1];

    try {

        // 2. Verify token
        const decoded = jwt.verify(token, config.JWT_SECRET as string) as JwtPayload;


        const user: any = await prisma.users.findUnique({ where: { email: decoded.identifier } });
        if (!user) {
            next()
            return;
        }
        // 3. Attach user info to request
        req.user = user;

        next();

    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};