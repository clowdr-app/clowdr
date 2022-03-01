interface ErrorOptions {
    privateMessage?: string;
    privateErrorData?: Partial<Record<string, any>>;
    originalError?: Error;
}

export class ClientError extends Error {
    constructor(publicMessage: string, public options: ErrorOptions) {
        super(publicMessage);
    }

    get name(): string {
        return this.constructor.name;
    }
}

export class ForbiddenError extends ClientError {
    constructor(publicMessage: string, public options: ErrorOptions) {
        super(publicMessage, options);
    }
}

export class BadRequestError extends ClientError {
    constructor(publicMessage: string, public options: ErrorOptions) {
        super(publicMessage, options);
    }
}

export class NotFoundError extends ClientError {
    constructor(publicMessage: string, public options: ErrorOptions) {
        super(publicMessage, options);
    }
}

export class ServerError extends Error {
    constructor(publicMessage: string, public options: ErrorOptions) {
        super(publicMessage);
    }

    get name(): string {
        return this.constructor.name;
    }
}

export class UnexpectedServerError extends ServerError {
    constructor(publicMessage: string, privateMessage: string | undefined, public originalError: unknown) {
        super(publicMessage, { privateMessage });
    }

    get name(): string {
        return this.constructor.name;
    }
}
