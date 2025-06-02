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
const userController_1 = require("../controllers/userController");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mocks
jest.mock('../models/User.model');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
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
    it('should login user and return token', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const fakeUser = {
            _id: 'userId123',
            email: 'tygger@exemple.com',
            username: 'tygger',
            password: 'Axel123456',
        };
        const mockUserProvider = {
            loginUser: jest.fn().mockResolvedValue(fakeUser),
        };
        const userController = new userController_1.UserController(mockUserProvider);
        jsonwebtoken_1.default.sign.mockReturnValue('mockedToken');
        const req = {
            body: {
                email: fakeUser.email,
                password: fakeUser.password,
            },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        yield userController.loginUser(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'User logged in successfully', id: fakeUser._id, token: 'mockedToken' });
        console.log((_a = res.status) === null || _a === void 0 ? void 0 : _a.mock.calls, (_b = res.json) === null || _b === void 0 ? void 0 : _b.mock.calls);
    }));
});
