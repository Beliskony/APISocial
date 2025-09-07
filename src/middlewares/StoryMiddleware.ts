import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './Auth.Types';
import { ZodSchema } from 'zod';

const StoryMiddleware = (schema: ZodSchema) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const method = req.method.toUpperCase();

            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                // Valide le body
                await schema.parseAsync(req.body);
            } else if (method === 'DELETE' || method === 'GET') {
                // Valide les params si présents
                await schema.parseAsync(req.params);
            }

            next();
        } catch (error) {
            res.status(400).json({
                message: 'Validation error',
                detail: error instanceof Error ? error.message : error,
            });
        }
    };
};

export default StoryMiddleware;
