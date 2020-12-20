import { Spinner } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useSelectAllContentGroupsQuery } from "../../../../../generated/graphql";
import useQueryErrorToast from "../../../../GQL/useQueryErrorToast";
import { useConference } from "../../../useConference";
import { convertContentGroupsToDescriptors } from "../../Content/Types";

export default function ReviewPanel(): JSX.Element {
    const conference = useConference();

    const {
        error: errorDBContentGroups,
        data: dbContentGroups,
    } = useSelectAllContentGroupsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorDBContentGroups);

    const contentGroupDescriptors = useMemo(() => convertContentGroupsToDescriptors(dbContentGroups), [
        dbContentGroups,
    ]);

    return (
        <>
            Review
            {errorDBContentGroups ? <>Error!</> : !contentGroupDescriptors ? <Spinner /> : <>TODO</>}
        </>
    );
}
