export function roundToNearest(value: number, divisor: number): number {
    return Math.round(value / divisor) * divisor;
}

export function roundDownToNearest(value: number, divisor: number): number {
    return value - (value % divisor);
}

export function roundUpToNearest(value: number, divisor: number): number {
    return value + (divisor - (value % divisor));
}

export function distanceToBoundary(value: number, divisor: number): number {
    const v = value % divisor;
    const v2 = Math.abs(divisor - v);
    return Math.min(v, v2);
}
