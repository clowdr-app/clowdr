import { useEffect } from "react";
import { gql } from "urql";
import { useConferenceBySlugQuery } from "../../generated/graphql";
import { useAuthParameters } from "../GQL/AuthParameters";

gql`
    query ConferenceBySlug($slug: String!) {
        conference_Conference(where: { slug: { _eq: $slug } }) {
            id
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
            refetchConferenceResponse();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conferenceSlug]);

    const conferenceId = conferenceResponse.data?.conference_Conference[0]?.id;
    useEffect(() => {
        if (conferenceSlug && conferenceSlug !== "" && conferenceId) {
            setConferenceId(conferenceId);
        } else {
            setConferenceId(null);
        }
    }, [conferenceId, conferenceSlug, setConferenceId]);
}
