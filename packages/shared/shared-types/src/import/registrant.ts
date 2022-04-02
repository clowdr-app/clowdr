import jsonata from "jsonata";
import { assertType, TypeGuardError } from "typescript-is";

export interface IntermediaryRegistrantData {
    name: string;
    email: string;
    group?: string;
    subconference?: string;
}

function internalRegistrantConverter(data: any, query: string): IntermediaryRegistrantData[] | string {
    const expression = jsonata(query);
    const result = expression.evaluate(data);
    if (assertType<IntermediaryRegistrantData[]>(result)) {
        return result;
    } else {
        return "Unknown error";
    }
}

export function JSONataToIntermediaryRegistrant(
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    data: any,
    query: string
): IntermediaryRegistrantData[] | string | undefined {
    try {
        return internalRegistrantConverter(data, query);
    } catch (e) {
        if (e instanceof TypeGuardError) {
            return e.message;
        }
        return undefined;
    }
}
