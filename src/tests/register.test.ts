import { UserController } from '../controllers/userController';
import { UserProvider } from '../providers/User.provider';
import { Request, Response } from 'express';
import { UserService } from '../services/User.service';
import { IUser } from '../models/User.model';
import jwt from 'jsonwebtoken';



// Mocks
jest.mock('../providers/User.provider');
jest.mock('jsonwebtoken');
jest.mock('bcrypt');

describe('UserController - createUser', () => {
  const mockRequest = (body: any): Partial<Request> => ({ body });
  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();
    return res;
  };

  let userController: UserController;
  let userProvider: jest.Mocked<UserProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockUserService = {} as jest.Mocked<UserService>;
    userProvider = new UserProvider(mockUserService) as jest.Mocked<UserProvider>;
    userController = new UserController(userProvider);
  });

  it('should return 400 if user creation fails', async () => {
    const req = mockRequest({ username: 'testuser' });
    const res = mockResponse();

    userProvider.createUser.mockRejectedValue(new Error('User creation failed'));

    await userController.createUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User creation failed' });
  });

  it('should create a user and return token and user ID', async () => {
     const reqBody = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      phoneNumber: '0788557270',
    };

    const createdUser: Partial<IUser> = {
      _id: '507f191e810c19729de860ea',
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      phoneNumber: '0788557270',
    }

    const req = mockRequest(reqBody);
    const res = mockResponse();

    userProvider.createUser.mockResolvedValue(createdUser as IUser);
    (jwt.sign as jest.Mock).mockReturnValue('mockedToken');

    await userController.createUser(req as Request, res as Response);

    expect(userProvider.createUser).toHaveBeenCalledWith(reqBody);

    expect(jwt.sign).toHaveBeenCalledWith(
      { _id: createdUser._id!.toString() , username: createdUser.username },
      expect.any(String),
      { expiresIn: '1h' }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Utilisateur enregistré avec succès',
      id: createdUser._id!.toString(),
      token: 'mockedToken',
    });
  });
});