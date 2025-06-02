"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePostRequest = void 0;
const CreatePostRequest = (schema) => {
    return (req, res, next) => {
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
exports.CreatePostRequest = CreatePostRequest;
