import { logger } from "../logger";
import type { ImportOutput } from "../types/job";
import type { InsertData } from "../types/task";
import { entityExists } from "./lib/exists";
import { insertTask as insertEntity } from "./lib/insert";
import { appendJobErrors, getJobOutput, updateJobProgressAndOutputs } from "./lib/job";
import { updateEntity } from "./lib/update";

export async function applyTask(jobId: string, data: InsertData): Promise<boolean> {
    try {
        // Apply output substitution before doing "exists" comparisons so that the
        // actual identifiers are available not just their reference names
        for (const columnName of data.remapColumns) {
            const outputName: string | null | undefined = (data.value as any)[columnName];
            if (outputName?.length) {
                const jobOutput = await getJobOutput(jobId, outputName);
                (data.value as any)[columnName] = jobOutput.value;
            }
        }

        const exists = await entityExists(data);
        switch (exists.state) {
            case "does_not_exist":
                await insertEntity(jobId, data);
                break;
            case "exists_update_required":
                await updateEntity(jobId, exists.data);
                break;
            case "exists_update_not_required":
                {
                    const outputs: ImportOutput[] = data.outputs.map((outputSource) => ({
                        name: outputSource.outputName,
                        value: exists.value[outputSource.columnName] ?? null,
                    }));

                    await updateJobProgressAndOutputs(jobId, outputs);
                }
                break;
        }
    } catch (error: any) {
        logger.error({ error, errorString: error?.toString(), jobId, data }, "Error applying");
        try {
            await appendJobErrors(jobId, [
                {
                    message: JSON.stringify(
                        {
                            error,
                            errorString: error?.toString(),
                            data,
                        },
                        undefined,
                        2
                    ),
                },
            ]);
        } catch (error2: any) {
            logger.error(
                { error: error2, errorString: error2?.toString(), jobId },
                "Unable to record error on import job due to a secondary error"
            );
        }
    }

    // Always continue - we don't want the entire importer to get stuck forever
    return true;
}
