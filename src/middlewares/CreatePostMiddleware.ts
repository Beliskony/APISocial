import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./Auth.Types";
import { ZodSchema } from "zod";

export const CreatePostRequest = (schema: ZodSchema) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
       
        if (!result.success) {
           res.status(500).json({ 
                message: "Erreur de creation du post", 
                errors: result.error.errors 
            });
            return;
        }
        req.body = result.data; // Update req.body with parsed data
        next();
    };
};
