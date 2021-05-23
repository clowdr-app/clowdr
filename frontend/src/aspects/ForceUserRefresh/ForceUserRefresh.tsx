import { gql } from "@apollo/client";
import {
    Kbd,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Progress,
    Text,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useGetForceUserRefreshConfigLazyQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { useRealTime } from "../Generic/useRealTime";
import { useRestorableState } from "../Generic/useRestorableState";

gql`
    query GetForceUserRefreshConfig($conferenceId: uuid!) {
        conference_Configuration(where: { conferenceId: { _eq: $conferenceId }, key: { _eq: "CLOWDR_APP_VERSION" } }) {
            id
            conferenceId
            key
            value
        }
    }
`;

export default function ForceUserRefresh(): JSX.Element {
    const conference = useConference();

    const [refetch, query] = useGetForceUserRefreshConfigLazyQuery({
        variables: {
            conferenceId: conference.id,
        },
        fetchPolicy: "network-only",
    });

    const [version, setVersion] = useRestorableState(
        "CLOWDR_APP_VERSION",
        "",
        (x) => x,
        (x) => x
    );
    const [lastCheckMs, setLastCheckMs] = useRestorableState(
        "CLOWDR_APP_VERSION_LAST_CHECK",
        0,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    const intervalMs = 5 * 60 * 1000;
    const now = useRealTime(intervalMs + 100);
    useEffect(() => {
        if (lastCheckMs + intervalMs <= now) {
            setLastCheckMs(now);
            refetch();
        }
    }, [intervalMs, lastCheckMs, now, refetch, setLastCheckMs]);

    const { isOpen, onOpen } = useDisclosure();

    useEffect(() => {
        try {
            if (!query.loading && !query.error && query.data && query.data.conference_Configuration.length > 0) {
                const config = query.data.conference_Configuration[0];
                if (config.value && config.value !== "") {
                    const latestVersion = config.value;
                    if (version !== latestVersion) {
                        setVersion(latestVersion);
                        if (version !== "") {
                            onOpen();
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error evaluating force refresh", e);
        }
    }, [version, query.data, query.error, query.loading, setVersion, onOpen]);

    const onClose = useCallback(() => {
        // Deliberately empty
    }, []);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            colorScheme="purple"
            closeOnOverlayClick={false}
            isCentered
            closeOnEsc={false}
            motionPreset="slideInBottom"
            size="lg"
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>A new version of Clowdr is available!</ModalHeader>
                <ModalBody>
                    <Text>
                        To receive the latest updates please refresh the page (<Kbd>F5</Kbd>)
                    </Text>
                </ModalBody>
                <ModalFooter>
                    <ProgressTimeout startTime={lastCheckMs} endTime={lastCheckMs + 3 * 60 * 1000} />
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

function ProgressTimeout({ startTime, endTime }: { startTime: number; endTime: number }) {
    const now = useRealTime(1000);
    const value = (100 * (endTime - now)) / (endTime - startTime);
    const timeRemaining = (endTime - now) / 1000;

    const history = useHistory();
    useEffect(() => {
        if (timeRemaining <= 1.05) {
            history.go(0);
        }
    }, [timeRemaining, history]);

    return (
        <VStack w="100%">
            <Progress size="sm" dir="" w="100%" value={100 - value} />
            <Text fontSize="sm">Automatic refresh in {Math.round(timeRemaining)}s</Text>
        </VStack>
    );
}
