// src/core/errors/custom.errors.ts
export class CustomError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string = "Requête invalide") {
    super(message, 400);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "Non autorisé") {
    super(message, 401);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = "Accès refusé") {
    super(message, 403);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "Ressource non trouvée") {
    super(message, 404);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = "Conflit de données") {
    super(message, 409);
  }
}