import { useEffect } from "react";
import { gql } from "urql";
import { useConferenceBySlugQuery } from "../../generated/graphql";
import { useAuthParameters } from "../GQL/AuthParameters";

gql`
    query ConferenceBySlug($slug: String!) {
        conference_Conference(where: { slug: { _eq: $slug } }) {
            id
            slug
        }
    }
`;

export default function useConferenceIdUpdater(): void {
    const { conferenceSlug, setConferenceId } = useAuthParameters();
    const [conferenceResponse, refetchConferenceResponse] = useConferenceBySlugQuery({
        variables: {
            slug: conferenceSlug ?? "",
        },
        pause: true,
    });

    useEffect(() => {
        if (conferenceSlug && conferenceSlug !== "") {
            refetchConferenceResponse({
                requestPolicy: "network-only",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conferenceSlug]);

    const conferenceId = conferenceResponse.data?.conference_Conference[0]?.id;
    const returnedConferenceSlug = conferenceResponse.data?.conference_Conference[0]?.slug;
    const loading = conferenceResponse.fetching;
    useEffect(() => {
        if (!loading && conferenceSlug === returnedConferenceSlug) {
            setConferenceId(conferenceId ?? "NONE");
        } else {
            setConferenceId(conferenceResponse.data?.conference_Conference.length === 0 ? "NONE" : null);
        }
    }, [
        loading,
        conferenceId,
        setConferenceId,
        conferenceSlug,
        returnedConferenceSlug,
        conferenceResponse.data?.conference_Conference.length,
    ]);
}
