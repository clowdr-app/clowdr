import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo, useState } from "react";
import { gql, useClient } from "urql";
import type { StartImportJobMutation, StartImportJobMutationVariables } from "../../../../../generated/graphql";
import { StartImportJobDocument, useGetImportJobsQuery } from "../../../../../generated/graphql";
import PageNotFound from "../../../../Errors/PageNotFound";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import usePolling from "../../../../Hooks/usePolling";
import { useTitle } from "../../../../Hooks/useTitle";
import RequireRole from "../../../RequireRole";
import { useConference } from "../../../useConference";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import { DashboardPage } from "../../DashboardPage";
import ImportProgramTabs from "./Tabs";

gql`
    fragment ImportJob on job_queues_ImportJob {
        id
        updated_at
        completed_at
        status
        progress
        progressMaximum
        errors
    }

    query GetImportJobs($conferenceId: uuid!, $subconferenceCond: uuid_comparison_exp!) {
        job_queues_ImportJob(
            where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }
            order_by: [{ created_at: desc }]
            limit: 1
        ) {
            ...ImportJob
        }
    }

    mutation StartImportJob($object: job_queues_ImportJob_insert_input!) {
        insert_job_queues_ImportJob_one(object: $object) {
            id
        }
    }
`;

export default function ImportProgramPage(): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const registrant = useCurrentRegistrant();
    const title = useTitle(`Import program to ${conference.shortName}`);

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [response, refetch] = useGetImportJobsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
        requestPolicy: "network-only",
    });
    const [justStarted, setJustStarted] = useState<boolean>(false);
    usePolling(() => {
        if (
            justStarted ||
            (response.data?.job_queues_ImportJob[0] && !response.data?.job_queues_ImportJob[0]?.completed_at)
        ) {
            refetch();
        }
    }, 5000);

    const client = useClient();
    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <DashboardPage title="Import Program" stickyHeader={false} autoOverflow={false}>
                <ImportProgramTabs
                    job={justStarted ? undefined : response.data?.job_queues_ImportJob[0]}
                    jobJustStarted={justStarted}
                    onStartImport={async (data, options) => {
                        setJustStarted(true);

                        setTimeout(() => {
                            setJustStarted(false);
                        }, 6000);

                        const response = await client
                            .mutation<StartImportJobMutation, StartImportJobMutationVariables>(
                                StartImportJobDocument,
                                {
                                    object: {
                                        conferenceId: conference.id,
                                        subconferenceId,
                                        createdBy: registrant.id,
                                        data,
                                        options,
                                    },
                                },
                                context
                            )
                            .toPromise();

                        if (response.error) {
                            if (
                                response.error.message.includes("Uniqueness violation") &&
                                response.error.message.includes("ImportJob_conferenceId_status_key")
                            ) {
                                throw new Error("Another import is already in progress");
                            } else {
                                throw response.error;
                            }
                        }
                    }}
                />
            </DashboardPage>
        </RequireRole>
    );
}
