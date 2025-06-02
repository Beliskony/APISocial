"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LikeRequest = void 0;
const LikeRequest = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                message: "Validation error",
                errors: result.error.errors
            });
        }
        req.body = result.data; // Update req.body with parsed data
        next();
    };
};
exports.LikeRequest = LikeRequest;
