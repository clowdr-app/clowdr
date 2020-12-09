const INVITE_CODE_KEY = "INVITE_CODE";

export function getCachedInviteCode(): string | null {
    return window.localStorage.getItem(INVITE_CODE_KEY);
}

export function setCachedInviteCode(value: string | null): void {
    if (!value) {
        window.localStorage.removeItem(INVITE_CODE_KEY);
    } else {
        window.localStorage.setItem(INVITE_CODE_KEY, value);
    }
}
