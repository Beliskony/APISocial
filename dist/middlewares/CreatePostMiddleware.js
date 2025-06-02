"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePostRequest = void 0;
const CreatePostRequest = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                message: "Validation error",
                errors: result.error.errors
            });
            return;
        }
        req.body = result.data; // Update req.body with parsed data
        next();
    };
};
exports.CreatePostRequest = CreatePostRequest;
