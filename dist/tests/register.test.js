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
const User_provider_1 = require("../providers/User.provider");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mocks
jest.mock('../providers/User.provider');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');
describe('UserController - createUser', () => {
    const mockRequest = (body) => ({ body });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };
    let userController;
    let userProvider;
    beforeEach(() => {
        jest.clearAllMocks();
        const mockUserService = {};
        userProvider = new User_provider_1.UserProvider(mockUserService);
        userController = new userController_1.UserController(userProvider);
    });
    it('should return 400 if user creation fails', () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest({ username: 'testuser' });
        const res = mockResponse();
        userProvider.createUser.mockRejectedValue(new Error('User creation failed'));
        yield userController.createUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'User creation failed' });
    }));
    it('should create a user and return token and user ID', () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest({
            username: 'testuser',
            password: 'password123',
            email: 'test@example.com',
            phoneNumber: '+1234567890',
        });
        const res = mockResponse();
        userProvider.createUser.mockResolvedValue(req.body);
        jsonwebtoken_1.default.sign.mockReturnValue('mockedToken');
        yield userController.createUser(req, res);
        expect(userProvider.createUser).toHaveBeenCalledWith({
            username: 'testuser',
            password: 'password123',
            email: 'test@example.com',
            phoneNumber: '+1234567890',
        });
        expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ _id: 'userId123', username: 'testuser' }, expect.any(String), { expiresIn: '1h' });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Utilisateur enregistré avec succès',
            id: 'userId123',
            token: 'mockedToken',
        });
    }));
});
