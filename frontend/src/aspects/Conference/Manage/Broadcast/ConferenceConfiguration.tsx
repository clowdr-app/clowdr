import { gql } from "@apollo/client";
import { Alert, AlertIcon, AlertTitle, Box, Heading } from "@chakra-ui/react";
import AmazonS3URI from "amazon-s3-uri";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import {
    ConferenceConfiguration_ConferenceConfigurationsFragment,
    useConferenceConfiguration_GetConferenceConfigurationsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";

gql`
    query ConferenceConfiguration_GetConferenceConfigurations($conferenceId: uuid!) {
        ConferenceConfiguration(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ConferenceConfiguration_ConferenceConfigurations
        }
    }

    fragment ConferenceConfiguration_ConferenceConfigurations on ConferenceConfiguration {
        id
        key
        value
    }

    mutation ConferenceConfiguration_UpdateConferenceConfigurations($conferenceConfigurationId: uuid!, $value: jsonb!) {
        update_ConferenceConfiguration_by_pk(pk_columns: { id: $conferenceConfigurationId }, _set: { value: $value }) {
            id
        }
    }
`;

export function ConferenceConfiguration({ conferenceId }: { conferenceId: string }): JSX.Element {
    const conferenceConfigurationsResult = useConferenceConfiguration_GetConferenceConfigurationsQuery({
        variables: {
            conferenceId,
        },
    });

    return (
        <ApolloQueryWrapper
            queryResult={conferenceConfigurationsResult}
            getter={(result) => result.ConferenceConfiguration}
        >
            {(configurations: readonly ConferenceConfiguration_ConferenceConfigurationsFragment[]) => (
                <FillerVideoConfiguration
                    fillerVideos={configurations.find((x) => x.key === "FILLER_VIDEOS")?.value ?? null}
                    update={() => {
                        //todo
                    }}
                />
            )}
        </ApolloQueryWrapper>
    );
}

function FillerVideoConfiguration({
    fillerVideos,
    update,
}: {
    fillerVideos: string[] | null;
    update: (fillerVideos: any[]) => void;
}): JSX.Element {
    const fillerVideoUrl = useMemo(() => {
        try {
            if (!fillerVideos) {
                return null;
            }
            const { bucket, key } = new AmazonS3URI(fillerVideos[0]);
            return `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
        } catch {
            return null;
        }
    }, [fillerVideos]);

    return (
        <Box minW="50vw">
            <Heading as="h3" size="md" textAlign="left" mb={3}>
                Filler video
            </Heading>
            {fillerVideoUrl ? (
                <ReactPlayer
                    url={fillerVideoUrl}
                    controls={true}
                    width="300px"
                    height="auto"
                    maxHeight="400px"
                    style={{ borderRadius: "10px", overflow: "hidden" }}
                />
            ) : (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>No video selected yet.</AlertTitle>
                </Alert>
            )}
        </Box>
    );
}
