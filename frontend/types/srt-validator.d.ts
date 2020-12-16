declare module "srt-validator" {
    interface SrtValidationError {
        errorCode: string;
        lineNumber: number;
        message: string;
        validator?: string;
    }

    export default function srtValidator(srtText: string): SrtValidationError[];
}
