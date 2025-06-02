"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostZodSchema = void 0;
const zod_1 = require("zod");
exports.PostZodSchema = zod_1.z.object({
    text: zod_1.z.string().max(500, "Le texte doit contenir maxi 500 caractere").optional(), // Optional text field with a maximum length of 500 characters,
    media: zod_1.z
        .object({
        images: zod_1.z.array(zod_1.z.string().url().trim()).max(5).optional(),
        videos: zod_1.z.array(zod_1.z.string().url().trim()).max(2).optional(),
    })
        .optional(),
    createdAt: zod_1.z.date().optional(),
    updatedAt: zod_1.z.date().optional(),
});
