// Adapted from https://github.com/Thream/socketio-jwt
//
// MIT License
//
// Copyright (c) Auth0, Inc. <support@auth0.com> (http://auth0.com) and Thream contributors and Clowdr contributors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import jwt, { Algorithm } from "jsonwebtoken";
import { Socket } from "socket.io";

export class UnauthorizedError extends Error {
    public inner: { message: string };
    public data: { message: string; code: string; type: "UnauthorizedError" };

    constructor(code: string, error: { message: string }) {
        super(error.message);

        this.message = error.message;
        this.inner = error;
        this.data = {
            message: this.message,
            code,
            type: "UnauthorizedError",
        };
    }
}

declare module "socket.io" {
    interface Socket extends ExtendedSocket {}
}

interface ExtendedError extends Error {
    data?: any;
}

interface ExtendedSocket {
    encodedToken?: string;
    decodedToken?: any;
}

type SocketIOMiddleware = (socket: Socket, next: (err?: ExtendedError) => void) => void;

interface CompleteDecodedToken {
    header: {
        alg: Algorithm;
        [key: string]: any;
    };
    payload: any;
}

type SecretCallback = (decodedToken: CompleteDecodedToken) => Promise<string>;

export interface AuthorizeOptions {
    secret: string | SecretCallback;
    algorithms?: Algorithm[];
}

export function authorize(options: AuthorizeOptions): SocketIOMiddleware {
    const { secret, algorithms = ["HS256"] } = options;
    return async (socket, next) => {
        const encodedToken = socket.handshake.auth.token;
        if (!encodedToken || typeof encodedToken !== "string") {
            return next(
                new UnauthorizedError("credentials_required", {
                    message: "no token provided",
                })
            );
        }

        socket.encodedToken = encodedToken;
        let keySecret: string | null = null;
        let decodedToken: any;
        if (typeof secret === "string") {
            keySecret = secret;
        } else {
            const completeDecodedToken = jwt.decode(encodedToken, { complete: true });
            keySecret = await secret(completeDecodedToken as CompleteDecodedToken);
        }
        try {
            decodedToken = jwt.verify(encodedToken, keySecret, { algorithms });
        } catch {
            return next(
                new UnauthorizedError("invalid_token", {
                    message: "Unauthorized: Token is missing or invalid Bearer",
                })
            );
        }
        socket.decodedToken = decodedToken;
        return next();
    };
}
