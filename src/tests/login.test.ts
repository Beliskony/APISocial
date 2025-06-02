import { loginUser } from '../middlewares/auth';
import { LoginZodSchema } from '../schemas/User.ZodSchema';
import { UserController } from '../controllers/userController';
import UserModel from '../models/User.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Mocks
jest.mock('../models/User.model');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('loginUser', () => {
  const mockRequest = (body: any): Partial<Request> => ({ body });
  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });


 it('should login user and return token', async () => {
    const fakeUser = {
      _id: 'userId123',
      email: 'tygger@exemple.com',
      username: 'tygger',
      password: 'Axel123456',
    };

    const mockUserProvider = {
      loginUser: jest.fn().mockResolvedValue(fakeUser),
    };
    
    const userController = new UserController(mockUserProvider as any);
    (jwt.sign as jest.Mock).mockReturnValue('mockedToken')

     const req = {
    body: {
      email: fakeUser.email,
      password: fakeUser.password,
    },
  } as Partial<Request>;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as Partial<Response>;
    
    await userController.loginUser(req as Request, res as Response);
    

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'User logged in successfully', id: fakeUser._id, token: 'mockedToken' });

    console.log( (res.status as jest.Mock)?.mock.calls, (res.json as jest.Mock)?.mock.calls );
  });


});