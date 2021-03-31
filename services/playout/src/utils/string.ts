export function truncate(str: string, maxLength: number): string {
    return str.length <= maxLength ? str : str.slice(0, maxLength);
}
