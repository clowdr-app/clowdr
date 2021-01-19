export function maybeCompare<T>(
    x: T | null | undefined,
    y: T | null | undefined,
    compare: (x: T, y: T) => number
): number {
    if (x !== undefined && x !== null) {
        if (y !== undefined && y !== null) {
            return compare(x, y);
        } else {
            return -1;
        }
    } else if (y !== undefined && y !== null) {
        return 1;
    } else {
        return 0;
    }
}

export default function maybeSort<T>(
    compare: (x: T, y: T) => number
): (x: T | null | undefined, y: T | null | undefined) => number {
    return (x, y) => {
        return maybeCompare<T>(x, y, compare);
    };
}
