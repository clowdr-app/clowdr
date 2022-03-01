import _ from "lodash";

export function argumentsAreEqual(a: any, b: any): boolean {
    const aIsEmptyArgs =
        a === null ||
        a === undefined ||
        (typeof a === "object" && (Object.keys(a).length === 0 || (a instanceof Array && a.length === 0)));
    const bIsEmptyArgs =
        b === null ||
        b === undefined ||
        (typeof b === "object" && (Object.keys(b).length === 0 || (b instanceof Array && b.length === 0)));
    if (aIsEmptyArgs) {
        if (bIsEmptyArgs) {
            return true;
        }
        return false;
    } else if (bIsEmptyArgs) {
        return false;
    } else {
        return _.isEqual(a, b);
    }
}
