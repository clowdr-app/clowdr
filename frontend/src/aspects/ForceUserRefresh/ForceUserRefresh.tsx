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
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { compare } from "compare-versions";
import React, { useCallback, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { gql } from "urql";
import { useGetForceUserRefreshConfigQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { makeContext } from "../GQL/make-context";
import { useRealTime } from "../Hooks/useRealTime";
import { useRestorableState } from "../Hooks/useRestorableState";

gql`
    query GetForceUserRefreshConfig($conferenceId: uuid!) {
        conference_Configuration_by_pk(conferenceId: $conferenceId, key: CLOWDR_APP_VERSION) {
            conferenceId
            key
            value
        }
    }
`;

export default function ForceUserRefresh(): JSX.Element {
    const conference = useConference();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Attendee,
            }),
        []
    );
    const [query, refetch] = useGetForceUserRefreshConfigQuery({
        variables: {
            conferenceId: conference.id,
        },
        requestPolicy: "network-only",
        pause: true,
        context,
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
            if (!query.fetching && !query.error && query.data && query.data.conference_Configuration_by_pk) {
                const config = query.data.conference_Configuration_by_pk;
                if (config.value && config.value !== "") {
                    const latestVersion = config.value;
                    if (version !== latestVersion) {
                        setVersion(latestVersion);

                        if (version !== "" && compare(latestVersion, version, ">")) {
                            onOpen();
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error evaluating force refresh", e);
        }
    }, [version, query.data, query.error, query.fetching, setVersion, onOpen]);

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
                <ModalHeader>A new version of Midspace is available!</ModalHeader>
                <ModalBody>
                    <Text>
                        To receive the latest updates please refresh the page (<Kbd>F5</Kbd>)
                    </Text>
                </ModalBody>
                <ModalFooter>
                    <ProgressTimeout scheduledStartTime={lastCheckMs} scheduledEndTime={lastCheckMs + 3 * 60 * 1000} />
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

function ProgressTimeout({
    scheduledStartTime,
    scheduledEndTime,
}: {
    scheduledStartTime: number;
    scheduledEndTime: number;
}) {
    const now = useRealTime(1000);
    const value = (100 * (scheduledEndTime - now)) / (scheduledEndTime - scheduledStartTime);
    const timeRemaining = (scheduledEndTime - now) / 1000;

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
