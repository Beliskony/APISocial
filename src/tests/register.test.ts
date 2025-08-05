import { UserController } from '../controllers/userController';
import { UserProvider } from '../providers/User.provider';
import { Request, Response } from 'express';
import { IUser } from '../models/User.model';
import jwt from 'jsonwebtoken';

jest.mock('../providers/User.provider');
jest.mock('jsonwebtoken');

describe('UserController - createUser', () => {
  let userController: UserController;
  let userProvider: jest.Mocked<UserProvider>;

  const mockRequest = (body: any): Partial<Request> => ({ body });
  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userProvider = new UserProvider({} as any) as jest.Mocked<UserProvider>;
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

    const createdUser = {
       _id: '507f191e810c19729de860ea',
      username: 'testuser',
      password: 'hashedpassword',
      email: 'test@example.com',
      phoneNumber: '0788557270',
      profilePicture: 'pic.jpg',
      posts: [],
      followers: [],
      toObject: function () {
        const { password, ...rest } = this;
        return rest;
    }
  };

    const req = mockRequest(reqBody);
    const res = mockResponse();

    userProvider.createUser.mockResolvedValue(createdUser as unknown as IUser);
    (jwt.sign as jest.Mock).mockReturnValue('mockedToken');

    await userController.createUser(req as Request, res as Response);

    expect(userProvider.createUser).toHaveBeenCalledWith(reqBody);
    expect(jwt.sign).toHaveBeenCalledWith(
       {
        _id: createdUser._id,
        username: createdUser.username,
        phoneNumber: createdUser.phoneNumber,
        email: createdUser.email,
        profilePicture: createdUser.profilePicture,
        posts: createdUser.posts,
        followers: createdUser.followers,
      },
      expect.any(String),
      { expiresIn: '30d' }
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Utilisateur enregistré avec succès',
      id: createdUser._id!.toString(),
      token: 'mockedToken',
    });
  });
});
