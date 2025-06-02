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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middlewares/auth");
const User_ZodSchema_1 = require("../schemas/User.ZodSchema");
const User_model_1 = __importDefault(require("../models/User.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const twilioConfig_1 = require("../config/twilioConfig");
// Mocks
jest.mock('../models/User.model');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('crypto');
jest.mock('../config/twilioConfig', () => ({
    twilioClient: {
        messages: {
            create: jest.fn(),
        },
    },
}));
describe('loginUser', () => {
    const mockRequest = (body) => ({ body });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should return 400 if credentials are missing', () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest({ usernameOrphoneNumber: '', password: '' });
        const res = mockResponse();
        const loginMiddleware = (0, auth_1.loginUser)(User_ZodSchema_1.LoginZodSchema);
        yield loginMiddleware(req, res, () => { });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Username and password are required' });
    }));
    it('should return 404 if user not found', () => __awaiter(void 0, void 0, void 0, function* () {
        User_model_1.default.findOne.mockResolvedValue(null);
        const req = mockRequest({ usernameOrphoneNumber: 'notfound', password: '123456' });
        const res = mockResponse();
        const loginMiddleware = (0, auth_1.loginUser)(User_ZodSchema_1.LoginZodSchema);
        yield loginMiddleware(req, res, () => { });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    }));
    it('should return 401 if password is incorrect', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeUser = {
            password: 'hashedPassword',
        };
        User_model_1.default.findOne.mockResolvedValue(fakeUser);
        bcrypt_1.default.compare.mockResolvedValue(false);
        const req = mockRequest({ usernameOrphoneNumber: 'test', password: 'wrongpass' });
        const res = mockResponse();
        const loginMiddleware = (0, auth_1.loginUser)(User_ZodSchema_1.LoginZodSchema);
        yield loginMiddleware(req, res, () => { });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    }));
    it('should return 400 if phoneNumber is missing', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeUser = {
            password: 'hashedPassword',
            phoneNumber: null,
        };
        User_model_1.default.findOne.mockResolvedValue(fakeUser);
        bcrypt_1.default.compare.mockResolvedValue(true);
        const req = mockRequest({ usernameOrphoneNumber: 'test', password: '123456' });
        const res = mockResponse();
        const loginMiddleware = (0, auth_1.loginUser)(User_ZodSchema_1.LoginZodSchema);
        yield loginMiddleware(req, res, () => { });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Phone number is required for OTP' });
    }));
    it('should login user and send OTP', () => __awaiter(void 0, void 0, void 0, function* () {
        const fakeUser = {
            _id: 'userId123',
            username: 'testuser',
            password: 'hashedPassword',
            otp: '',
            phoneNumber: '+1234567890',
            save: jest.fn(),
        };
        User_model_1.default.findOne.mockResolvedValue(fakeUser);
        bcrypt_1.default.compare.mockResolvedValue(true);
        crypto_1.default.randomInt.mockReturnValue(123456);
        twilioConfig_1.twilioClient.messages.create.mockResolvedValue({});
        jsonwebtoken_1.default.sign.mockReturnValue('mockedToken');
        const req = mockRequest({ usernameOrphoneNumber: 'testuser', password: '123456' });
        const res = mockResponse();
        const loginMiddleware = (0, auth_1.loginUser)(User_ZodSchema_1.LoginZodSchema);
        yield loginMiddleware(req, res, () => { });
        expect(fakeUser.otp).toBe('123456');
        expect(fakeUser.save).toHaveBeenCalled();
        expect(twilioConfig_1.twilioClient.messages.create).toHaveBeenCalledWith({
            body: `Your OTP code is 123456 il expire dans 5 minutes`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: '+1234567890',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Login successful',
            token: 'mockedToken',
        });
    }));
});
