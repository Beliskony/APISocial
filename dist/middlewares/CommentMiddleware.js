"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentMiddleware = void 0;
const CommentMiddleware = (schema) => {
    return (req, res, next) => {
        try {
            // Validate the request body against the schema
            schema.parse(req.body);
            next(); // Proceed to the next middleware or route handler
        }
        catch (error) {
            // Handle validation errors
            res.status(400).json({ message: 'Validation error', errors: error });
        }
    };
};
exports.CommentMiddleware = CommentMiddleware;
