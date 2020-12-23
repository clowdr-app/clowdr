import { Spinner } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useSelectAllContentQuery } from "../../../../../generated/graphql";
import useQueryErrorToast from "../../../../GQL/useQueryErrorToast";
import { useConference } from "../../../useConference";
import { convertContentToDescriptors } from "../../Content/Functions";
import type { AllContentStateT } from "../../Content/useSaveContentDiff";

export default function ReviewPanel(): JSX.Element {
    const conference = useConference();

    const { error: errorDBContentGroups, data: allContent } = useSelectAllContentQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorDBContentGroups);

    const [original, setOriginal] = useState<AllContentStateT>();
    useEffect(() => {
        if (allContent) {
            setOriginal(convertContentToDescriptors(allContent));
        }
    }, [allContent]);

    return (
        <>
            Review
            {errorDBContentGroups ? <>Error!</> : !original ? <Spinner /> : <>TODO</>}
        </>
    );
}
