export class ApplicationError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
  }
}

export class EntityNotFound extends ApplicationError {}

export class NoAutenticado extends ApplicationError {}

export class NoAutorizado extends ApplicationError {}

export class BadRequestError extends ApplicationError {
  constructor(message, details = []) {
    super(message)
    this.details = details
  }
}
