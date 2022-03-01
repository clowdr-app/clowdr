export function generateSessionRootOutputName(fileIndex: number, sessionIndex: number) {
    return composeOutputNames(`files[${fileIndex}]`, `sessions[${sessionIndex}]`);
}

export function generateExhibitionRootOutputName(fileIndex: number, exhibitionIndex: number) {
    return composeOutputNames(`files[${fileIndex}]`, `exhibitions[${exhibitionIndex}]`);
}

export function composeOutputNames(a: string, b: string) {
    return `${a}.${b}`;
}
