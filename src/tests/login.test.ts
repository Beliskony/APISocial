import { UserController } from '../controllers/userController';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

jest.mock('jsonwebtoken');

describe('UserController - loginUser', () => {
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
      profilePicture: 'Image.jpg',
      phoneNumber: '1234567890',
      posts: [],
      followers: [],
      toObject: function () {
        const { password, ...rest } = this;
        return rest;
      }
    };

    const mockUserProvider = {
      loginUser: jest.fn().mockResolvedValue(fakeUser),
    };

    const userController = new UserController(mockUserProvider as any);
    (jwt.sign as jest.Mock).mockReturnValue('mockedToken');

    const req = mockRequest({
      identifiant: fakeUser.email,  // <-- utiliser "identifiant" ici
      password: fakeUser.password,
    }) as Request;

    const res = mockResponse() as Response;

    await userController.loginUser(req, res);

    expect(mockUserProvider.loginUser).toHaveBeenCalledWith({ identifiant: fakeUser.email, password: fakeUser.password });
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        _id: fakeUser._id,
        username: fakeUser.username,
        phoneNumber: fakeUser.phoneNumber,
        email: fakeUser.email,
        profilePicture: fakeUser.profilePicture,
        posts: fakeUser.posts,
        followers: fakeUser.followers,
      },
      expect.any(String),
      { expiresIn: '30d' }
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User logged in successfully',
      id: fakeUser._id,
      username: fakeUser.username,
      email: fakeUser.email,
      phoneNumber: fakeUser.phoneNumber,
      profilePicture: fakeUser.profilePicture,
      posts: fakeUser.posts,
      followers: fakeUser.followers,
      token: 'mockedToken',
    });
  });
});
