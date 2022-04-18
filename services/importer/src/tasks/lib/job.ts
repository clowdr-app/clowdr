import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    AppendJobErrorsMutation,
    AppendJobErrorsMutationVariables,
    GetJobOutputQuery,
    GetJobOutputQueryVariables,
    GetJobQuery,
    GetJobQueryVariables,
    ImportJobFragment,
    IncreaseJobProgressAndProgressMaximumMutation,
    IncreaseJobProgressAndProgressMaximumMutationVariables,
    IncreaseJobProgressMaximumMutation,
    IncreaseJobProgressMaximumMutationVariables,
    IncreaseJobProgressMutation,
    IncreaseJobProgressMutationVariables,
    Job_Queues_ImportJob_Set_Input,
    UpdateJobMutation,
    UpdateJobMutationVariables,
    UpdateJobProgressAndOutputsMutation,
    UpdateJobProgressAndOutputsMutationVariables,
} from "../../generated/graphql";
import {
    AppendJobErrorsDocument,
    GetJobDocument,
    GetJobOutputDocument,
    IncreaseJobProgressAndProgressMaximumDocument,
    IncreaseJobProgressDocument,
    IncreaseJobProgressMaximumDocument,
    UpdateJobDocument,
    UpdateJobProgressAndOutputsDocument,
} from "../../generated/graphql";
import type { ImportErrors, ImportJob, ImportOutput } from "../../types/job";

gql`
    fragment ImportJob on job_queues_ImportJob {
        id
        created_at
        updated_at
        status
        data
        options
        createdBy
        completed_at
        conferenceId
        subconferenceId
        errors
        progress
        progressMaximum
    }

    query GetJob($jobId: uuid!) {
        job_queues_ImportJob_by_pk(id: $jobId) {
            ...ImportJob
        }
    }
`;

const localJobCache = new Map<string, { fetchedAt: number; value: ImportJobFragment }>();
export async function getJob(jobId: string, ignoreCache = false): Promise<ImportJob> {
    for (const key of localJobCache.keys()) {
        const job = localJobCache.get(key);
        if (job) {
            if (Date.now() - job.fetchedAt > 20 * 60 * 1000) {
                localJobCache.delete(key);
            }
        }
    }

    const cachedJob = localJobCache.get(jobId);
    if (!ignoreCache && cachedJob) {
        return cachedJob.value;
    }

    const response = await gqlClient
        ?.query<GetJobQuery, GetJobQueryVariables>(GetJobDocument, {
            jobId,
        })
        .toPromise();
    if (response?.error) {
        throw response.error;
    }
    const job = response?.data?.job_queues_ImportJob_by_pk ?? null;
    if (!job) {
        throw new Error("Unable to retrieve job");
    }
    localJobCache.set(jobId, { fetchedAt: Date.now(), value: job });
    return job;
}

gql`
    query GetJobOutput($jobId: uuid!, $name: String!) {
        job_queues_ImportJobOutput(where: { jobId: { _eq: $jobId }, name: { _eq: $name } }) {
            id
            name
            value
        }
    }
`;

const localJobOutputCache = new Map<string, { fetchedAt: number; value: ImportOutput }>();
export function clearLocalJobOutputCache() {
    localJobOutputCache.clear();
}
export async function getJobOutput(jobId: string, name: string, ignoreCache = false): Promise<ImportOutput> {
    for (const key of localJobOutputCache.keys()) {
        const job = localJobOutputCache.get(key);
        if (job) {
            if (Date.now() - job.fetchedAt > 20 * 60 * 1000) {
                localJobOutputCache.delete(key);
            }
        }
    }

    const cachedJobOutput = localJobOutputCache.get(jobId + "::" + name);
    if (!ignoreCache && cachedJobOutput) {
        return cachedJobOutput.value;
    }

    const response = await gqlClient
        ?.query<GetJobOutputQuery, GetJobOutputQueryVariables>(GetJobOutputDocument, {
            jobId,
            name,
        })
        .toPromise();
    if (response?.error) {
        throw response.error;
    }
    const jobOutput = response?.data?.job_queues_ImportJobOutput[0] ?? null;
    if (!jobOutput) {
        throw new Error(`Unable to retrieve job output: ${name}`);
    }

    localJobOutputCache.set(jobId + "::" + name, { fetchedAt: Date.now(), value: jobOutput });

    return jobOutput;
}

gql`
    mutation UpdateJob($jobId: uuid!, $update: job_queues_ImportJob_set_input!) {
        update_job_queues_ImportJob_by_pk(pk_columns: { id: $jobId }, _set: $update) {
            ...ImportJob
        }
    }
`;

export async function updateJob(
    jobId: string,
    update: Omit<Job_Queues_ImportJob_Set_Input, "progress" | "progressMaximum">
): Promise<void> {
    const response = await gqlClient
        ?.mutation<UpdateJobMutation, UpdateJobMutationVariables>(UpdateJobDocument, {
            jobId,
            update,
        })
        .toPromise();
    if (response?.error) {
        throw response.error;
    }
    if (localJobCache.has(jobId) && response?.data?.update_job_queues_ImportJob_by_pk) {
        localJobCache.set(jobId, { fetchedAt: Date.now(), value: response.data.update_job_queues_ImportJob_by_pk });
    }
}

export async function completeJob(jobId: string): Promise<void> {
    const response = await gqlClient
        ?.mutation<UpdateJobMutation, UpdateJobMutationVariables>(UpdateJobDocument, {
            jobId,
            update: {
                completed_at: new Date().toISOString(),
            },
        })
        .toPromise();
    if (response?.error) {
        throw response.error;
    }
    localJobCache.delete(jobId);
}

gql`
    mutation IncreaseJobProgress($jobId: uuid!, $increase: Int!, $status: String!) {
        update_job_queues_ImportJob_by_pk(
            pk_columns: { id: $jobId }
            _set: { status: $status }
            _inc: { progress: $increase }
        ) {
            id
            progress
            progressMaximum
        }
    }
`;

export async function increaseJobProgress(jobId: string, status: string, increase: number): Promise<boolean> {
    const result = await gqlClient
        ?.mutation<IncreaseJobProgressMutation, IncreaseJobProgressMutationVariables>(IncreaseJobProgressDocument, {
            jobId,
            increase,
            status,
        })
        .toPromise();
    if (result?.error) {
        throw result.error;
    }
    if (result?.data?.update_job_queues_ImportJob_by_pk) {
        const data = result.data.update_job_queues_ImportJob_by_pk;
        const cachedJob = localJobCache.get(jobId);
        if (cachedJob) {
            cachedJob.value.progress = data.progress;
            cachedJob.value.progressMaximum = data.progressMaximum;
        }

        return handleMaybeComplete(jobId, data.progress, data.progressMaximum);
    } else {
        throw new Error("Unable to update job progress");
    }
}

gql`
    mutation IncreaseJobProgressMaximum($jobId: uuid!, $increase: Int!, $status: String!) {
        update_job_queues_ImportJob_by_pk(
            pk_columns: { id: $jobId }
            _set: { status: $status }
            _inc: { progressMaximum: $increase }
        ) {
            id
            progress
            progressMaximum
        }
    }
`;

export async function increaseJobProgressMaximum(jobId: string, status: string, increase: number): Promise<boolean> {
    const result = await gqlClient
        ?.mutation<IncreaseJobProgressMaximumMutation, IncreaseJobProgressMaximumMutationVariables>(
            IncreaseJobProgressMaximumDocument,
            {
                jobId,
                increase,
                status,
            }
        )
        .toPromise();
    if (result?.error) {
        throw result.error;
    }
    if (result?.data?.update_job_queues_ImportJob_by_pk) {
        const data = result.data.update_job_queues_ImportJob_by_pk;
        const cachedJob = localJobCache.get(jobId);
        if (cachedJob) {
            cachedJob.value.progress = data.progress;
            cachedJob.value.progressMaximum = data.progressMaximum;
        }

        return handleMaybeComplete(jobId, data.progress, data.progressMaximum);
    } else {
        throw new Error("Unable to update job progressMaximum");
    }
}

gql`
    mutation IncreaseJobProgressAndProgressMaximum(
        $jobId: uuid!
        $increaseProgress: Int!
        $increaseProgressMaximum: Int!
        $status: String!
    ) {
        update_job_queues_ImportJob_by_pk(
            pk_columns: { id: $jobId }
            _set: { status: $status }
            _inc: { progress: $increaseProgress, progressMaximum: $increaseProgressMaximum }
        ) {
            id
            progress
            progressMaximum
        }
    }
`;

export async function increaseJobProgressAndProgressMaximum(
    jobId: string,
    status: string,
    increaseProgress: number,
    increaseProgressMaximum: number
): Promise<boolean> {
    const result = await gqlClient
        ?.mutation<
            IncreaseJobProgressAndProgressMaximumMutation,
            IncreaseJobProgressAndProgressMaximumMutationVariables
        >(IncreaseJobProgressAndProgressMaximumDocument, {
            jobId,
            increaseProgress,
            increaseProgressMaximum,
            status,
        })
        .toPromise();
    if (result?.error) {
        throw result.error;
    }
    if (result?.data?.update_job_queues_ImportJob_by_pk) {
        const data = result.data.update_job_queues_ImportJob_by_pk;
        const cachedJob = localJobCache.get(jobId);
        if (cachedJob) {
            cachedJob.value.progress = data.progress;
            cachedJob.value.progressMaximum = data.progressMaximum;
        }

        return handleMaybeComplete(jobId, data.progress, data.progressMaximum);
    } else {
        throw new Error("Unable to update job progressMaximum");
    }
}

gql`
    mutation AppendJobErrors($jobId: uuid!, $errors: jsonb!, $completedAt: timestamptz) {
        update_job_queues_ImportJob_by_pk(
            pk_columns: { id: $jobId }
            _append: { errors: $errors }
            _set: { completed_at: $completedAt }
        ) {
            id
        }
    }
`;

export async function appendJobErrors(jobId: string, errors: ImportErrors, markCompleted = false): Promise<void> {
    const response = await gqlClient
        ?.mutation<AppendJobErrorsMutation, AppendJobErrorsMutationVariables>(AppendJobErrorsDocument, {
            jobId,
            errors,
            completedAt: markCompleted ? new Date().toISOString() : null,
        })
        .toPromise();
    if (response?.error) {
        throw response.error;
    }
    localJobCache.delete(jobId);
}

gql`
    mutation UpdateJobProgressAndOutputs($jobId: uuid!, $outputs: [job_queues_ImportJobOutput_insert_input!]!) {
        update_job_queues_ImportJob_by_pk(pk_columns: { id: $jobId }, _inc: { progress: 1 }) {
            id
            progress
            progressMaximum
        }
        insert_job_queues_ImportJobOutput(
            objects: $outputs
            on_conflict: { constraint: ImportJobOutput_jobId_name_key, update_columns: [value] }
        ) {
            affected_rows
        }
    }
`;

export async function updateJobProgressAndOutputs(jobId: string, outputs: ImportOutput[]): Promise<boolean> {
    const result = await gqlClient
        ?.mutation<UpdateJobProgressAndOutputsMutation, UpdateJobProgressAndOutputsMutationVariables>(
            UpdateJobProgressAndOutputsDocument,
            {
                jobId,
                outputs: outputs.map((output) => ({
                    jobId,
                    name: output.name,
                    value: output.value,
                })),
            }
        )
        .toPromise();
    if (result?.error) {
        throw result.error;
    }
    if (result?.data?.update_job_queues_ImportJob_by_pk) {
        const data = result.data.update_job_queues_ImportJob_by_pk;
        const cachedJob = localJobCache.get(jobId);
        if (cachedJob) {
            cachedJob.value.progress = data.progress;
            cachedJob.value.progressMaximum = data.progressMaximum;
        }

        for (const output of outputs) {
            localJobOutputCache.set(jobId + "::" + output.name, { fetchedAt: Date.now(), value: output });
        }

        return handleMaybeComplete(jobId, data.progress, data.progressMaximum);
    } else {
        throw new Error("Unable to update job progress and outputs");
    }
}

async function handleMaybeComplete(jobId: string, progress: number, progressMaximum: number) {
    // logger.info({ jobId, progress, progressMaximum }, `Progress update for ${jobId}`);
    if (progress >= progressMaximum) {
        await completeJob(jobId);
        return true;
    }
    return false;
}
