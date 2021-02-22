import { gql } from "@apollo/client";
import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useGetForceUserRefreshConfigQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { useRestorableState } from "../Generic/useRestorableState";

gql`
    query GetForceUserRefreshConfig($conferenceId: uuid!) {
        ConferenceConfiguration(where: { conferenceId: { _eq: $conferenceId }, key: { _eq: "CLOWDR_APP_VERSION" } }) {
            id
            conferenceId
            key
            value
        }
    }
`;

export default function ForceUserRefresh(): JSX.Element {
    const conference = useConference();

    const query = useGetForceUserRefreshConfigQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: 5 * 60 * 1000,
    });

    const [version, setVersion] = useRestorableState(
        "CLOWDR_APP_VERSION",
        "",
        (x) => x,
        (x) => x
    );

    const history = useHistory();

    useEffect(() => {
        try {
            if (!query.loading && !query.error && query.data && query.data.ConferenceConfiguration.length > 0) {
                const config = query.data.ConferenceConfiguration[0];
                if (config.value && config.value !== "") {
                    const latestVersion = config.value;
                    if (version !== latestVersion) {
                        setVersion(latestVersion);
                        if (version !== "") {
                            history.go(0);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error evaluating force refresh", e);
        }
    }, [history, version, query.data, query.error, query.loading, setVersion]);

    return <></>;
}
