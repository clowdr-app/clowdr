export function truncate(str: string, maxLength: number): string {
    return str.length <= maxLength ? str : str.slice(0, maxLength);
}

export function removeInvalidTagChars(str: string): string {
    return str.replace(/[^a-z0-9_.:/=+\-@ ]/gi, "_");
}

export function toSafeTagValue(str: string): string {
    return removeInvalidTagChars(truncate(str, 200));
}
