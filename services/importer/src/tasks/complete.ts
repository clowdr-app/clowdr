import { completeJob } from "./lib/job";

export async function completeTask(jobId: string): Promise<boolean> {
    await completeJob(jobId);
    return true;
}
