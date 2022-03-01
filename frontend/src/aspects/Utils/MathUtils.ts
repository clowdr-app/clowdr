export function roundToNearest(value: number, divisor: number): number {
    return Math.round(value / divisor) * divisor;
}

export function roundDownToNearest(value: number, divisor: number): number {
    return value - (value % divisor);
}

export function roundUpToNearest(value: number, divisor: number): number {
    const x = value % divisor;
    return x !== 0 ? value + (divisor - x) : value;
}

export function distanceToBoundary(value: number, divisor: number): number {
    const v = value % divisor;
    const v2 = Math.abs(divisor - v);
    return Math.min(v, v2);
}
