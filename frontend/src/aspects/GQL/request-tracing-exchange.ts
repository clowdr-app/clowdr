import type { Exchange, Operation } from "@urql/core";
import { v4 as uuidv4 } from "uuid";
import { map, pipe } from "wonka";

const makeFetchOptions = (operation: Operation): RequestInit => {
    const fetchOptions =
        typeof operation.context.fetchOptions === "function"
            ? operation.context.fetchOptions()
            : operation.context.fetchOptions || {};

    return {
        ...fetchOptions,
        headers: { ["X-Request-Id"]: uuidv4(), ...fetchOptions.headers },
    };
};

export const requestTracingExchange: Exchange = ({ forward }) => {
    const processIncomingOperation = (operation: Operation): Operation => {
        operation.context.fetchOptions = makeFetchOptions(operation);
        return operation;
    };

    return (ops$) => {
        return pipe(ops$, map(processIncomingOperation), forward);
    };
};
