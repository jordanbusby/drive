abstract class HTTPError extends Error {
    public status!: number;
}

export class BadRequest extends HTTPError {
    constructor(message = 'Bad Request'){
    super(message)
    this.status = 400
    }
}

export class Unauthorized extends HTTPError {
    constructor(message = 'Unauthorized'){
        super(message);
        this.status = 401
    }
}