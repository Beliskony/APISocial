"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostUpdateZodSchema = void 0;
const zod_1 = require("zod");
exports.PostUpdateZodSchema = zod_1.z.object({
    text: zod_1.z.string().max(500, "Text must be at most 500 characters").optional(),
    media: zod_1.z
        .object({
        images: zod_1.z.array(zod_1.z.string().url().trim()).max(5, "Maximum 5 images are allowed.").optional(),
        videos: zod_1.z.array(zod_1.z.string().url().trim()).max(2, "Maximum 2 videos are allowed.").optional(),
    })
        .optional(),
});
