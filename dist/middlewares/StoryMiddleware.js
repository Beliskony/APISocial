"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const StoryMiddleware = (schema) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (['POST', 'Delete'].includes(req.method.toUpperCase())) {
                yield schema.parseAsync(req.body);
            }
            else if (req.method === 'GET') {
                yield schema.parseAsync(req.query);
            }
            next();
        }
        catch (error) {
            res.status(400).json({
                message: 'Validation error',
                detail: error instanceof Error ? error.message : error,
            });
        }
        ;
    });
};
exports.default = StoryMiddleware;
