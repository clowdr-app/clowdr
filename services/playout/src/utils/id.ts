import { customAlphabet } from "nanoid";

export function shortId(length = 6): string {
    return `C${customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890", length - 1)()}`;
}
