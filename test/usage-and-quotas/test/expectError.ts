import { expect } from "vitest";
import extractActualError from "./triggers/extractError";

export default async function expectError(message: string, p: Promise<unknown>, doExtract = true): Promise<void> {
    if (!doExtract) {
        await expect(p).rejects.toThrowError(message);
    } else {
        await expect(
            p.catch((error) => {
                throw extractActualError(error);
            })
        ).rejects.toThrowError(message);
    }
}
