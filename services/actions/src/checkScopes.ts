// The MIT License (MIT)
//
// Copyright (c) 2016 Auth0, Inc. <support@auth0.com> (http://auth0.com)
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
//
// This source file is adapated from the following source by
// Ed Nutting of Clowdr CIC.
//
// https://github.com/auth0/express-jwt-authz/blob/master/lib/index.js

import { NextFunction, Request, Response } from "express";

export type AuthenticatedRequest = Request & { userId: string };

export default function checkScopes(
    expectedScopes: string[],
    authKey: string,
    namespaceKey: string,
    scopeKey: string,
    userIdKey: string,
    checkAllScopes = false,
    failWithError = false
) {
    return (_req: Request, res: Response, next: NextFunction): void => {
        const req: any = _req;

        const error = (res: Response) => {
            const err_message = "Insufficient scope";

            if (failWithError) {
                return next({
                    statusCode: 403,
                    error: "Forbidden",
                    message: err_message,
                });
            }

            // https://hasura.io/docs/1.0/graphql/core/actions/action-handlers.html#returning-an-error-response
            res.status(403);
            res.json({
                message: err_message,
            });
        };

        if (expectedScopes.length === 0) {
            return next();
        }

        if (
            authKey in req &&
            req[authKey] &&
            namespaceKey in req[authKey] &&
            req[authKey][namespaceKey] &&
            scopeKey in req[authKey][namespaceKey] &&
            req[authKey][namespaceKey][scopeKey]
        ) {
            const scopesSource = req[authKey][namespaceKey][scopeKey];
            let authScopes: string[];
            if (typeof scopesSource === "string") {
                authScopes = scopesSource.split(" ");
            } else if (Array.isArray(scopesSource)) {
                authScopes = scopesSource;
            } else {
                return error(res);
            }

            let allowed: boolean;
            if (checkAllScopes) {
                allowed = expectedScopes.every((scope) => authScopes.includes(scope));
            } else {
                allowed = expectedScopes.some((scope) => authScopes.includes(scope));
            }

            if (allowed) {
                req.userId = req[authKey][namespaceKey][userIdKey];
                return next();
            } else {
                return error(res);
            }
        }

        return error(res);
    };
}
