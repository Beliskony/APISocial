import { PostZodSchema } from "../schemas/Post.ZodSchema";
import { CreatePostRequest } from "../middlewares/CreatePostMiddleware";
import { DeletePostMiddleware } from "../middlewares/DeletePostMiddleware";
import { UpdatePostMiddleware } from "../middlewares/UpdatePostMiddleware";
import PostModel from "../models/Post.model";
import { Request, Response } from "express";



// Mocks
jest.mock("../models/Post.model", () => ({
  create: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../middlewares/CreatePostMiddleware", () => ({
  CreatePostRequest: jest.fn((schema) => {
    return async (req: Request, res: Response, next: Function) => {
      // Simule la validation réussie
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
        return;
      }
      req.body = parsed.data;
      // Simule la création de post dans la DB
     next();
    };
  }),
}));


jest.mock("../middlewares/DeletePostMiddleware", () => ({
  DeletePostMiddleware: jest.fn((schema) => {
    return jest.fn(async (req: Request, res: Response, next: Function) => {
      try {
        const deleted = await PostModel.findByIdAndDelete(req.params.id);
        if (!deleted) {
          res.status(404).json({ message: "Post not found" });
          return;
        }
        res.status(200).json(deleted);
      } catch {
        res.status(500).json({ message: "Error deleting post" });
      }
    }); 
    }),
}));


jest.mock("../middlewares/UpdatePostMiddleware", () => ({
  UpdatePostMiddleware: jest.fn((schema) => {
    return jest.fn(async (req: Request, res: Response, next: Function) => {
      try {
        const updated = await PostModel.findByIdAndUpdate(req.body.id, req.body, { new: true });
        if (!updated) {
          res.status(404).json({ message: "Post not found" });
          return;
        }
        res.status(200).json(updated);
      } catch {
        res.status(500).json({ message: "Error updating post" });
      }
    });
}),
}));


jest.mock("../schemas/Post.ZodSchema", () => ({
  PostZodSchema: {
    parse: jest.fn(),
    safeParse: jest.fn(),
  },
}));

//pour la creation
describe("CreatePostMiddleware", () => {
  const mockRequest = (body: any): Partial<Request> => ({ body });
  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (PostZodSchema.safeParse as jest.Mock).mockImplementation((data) => {
      if (!data || Object.keys(data).length === 0) {
        return { success: false, error: { errors: [{ message: "Invalid data" }] } };
      }
      return { success: true, data };
    });
  });

  it("should call next if body is valid", async () => {
    const req = mockRequest({
      user: "507f191e810c19729de860ea",
      text: "Test post",
      media: "img.jpg",
    }) as Request;

    const res = mockResponse() as Response;
    const next = jest.fn();

    const createPostMiddleware = CreatePostRequest(PostZodSchema);
    await createPostMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 400 if body is invalid", async () => {
    const req = mockRequest({}) as Request; // corps invalide
    const res = mockResponse() as Response;
    const next = jest.fn();

    const createPostMiddleware = CreatePostRequest(PostZodSchema);
    await createPostMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validation error",
        errors: expect.any(Array),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});


//pour la suppression
describe ("DeletePostMiddleware", () => {
    const mockRequest = (params: any): Partial<Request> => ({ params });
    const mockResponse = (): Partial<Response> => {
        const res: Partial<Response> = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should delete a post and return the deleted post", async () => {
        const req = {
                 params:
                  { id: "postId123" }
                };

        const res = {
                  status: jest.fn().mockReturnThis(),
                  json: jest.fn()
                };

        const deletedPost = {
          id: "postId123",
          media: "img.jpg",
          text: "old",
        };

        (PostModel.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedPost);
        
        const deletePostMiddleware = DeletePostMiddleware(PostZodSchema);
        await deletePostMiddleware(req as unknown as Request, res as unknown as Response, () => {});

        expect(PostModel.findByIdAndDelete).toHaveBeenCalledWith("postId123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(deletedPost);
    });

    it("should return 404 if post not found", async () => {
        const req = mockRequest({ id: "postId123" });
        const res = mockResponse();

        (PostModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

        const deletePostMiddleware = DeletePostMiddleware(PostZodSchema);
        await deletePostMiddleware(req as Request, res as Response, () => {});

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    });
})


//pour la mise à jour ou modification
describe("UpdatePostMiddleware", () => {
    const MockRequest = (body: any): Partial<Request> => ({ body });
    const MockResponse = (): Partial<Response> => {
        const res: Partial<Response> = {};
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        return res;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should update a post and return the updated post", async () => {
        const req = MockRequest({
            id: "postId123",
            text: "Updated Post",
            media: "This is an updated post",
        });
        const res = MockResponse();

        (PostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(req.body);

        const updatePostMiddleware = UpdatePostMiddleware(PostZodSchema);
        await updatePostMiddleware(req as Request, res as Response, () => {});

        expect(PostModel.findByIdAndUpdate).toHaveBeenCalledWith("postId123", req.body, {
            new: true,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(req.body);
    });

    it("should return 404 if post not found", async () => {
        const req = MockRequest({
            id: "postId123",
            text: "Updated Post",
            media: "This is an updated post",
        });
        const res = MockResponse();

        (PostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

        const updatePostMiddleware = UpdatePostMiddleware(PostZodSchema);
        await updatePostMiddleware(req as Request, res as Response, () => {});

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Post not found" });
    })
})