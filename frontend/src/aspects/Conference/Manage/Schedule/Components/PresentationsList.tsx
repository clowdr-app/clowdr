import { Box, chakra, Spinner, Text, VStack } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useEffect, useMemo } from "react";
import { gql } from "urql";
import type { ManageSchedule_PresentationFragment, ManageSchedule_TagFragment } from "../../../../../generated/graphql";
import { useManageSchedule_GetPresentationsQuery } from "../../../../../generated/graphql";
import Card from "../../../../Card";
import useSelectorColors from "../../../../Card/useSelectorColors";
import FAIcon from "../../../../Chakra/FAIcon";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import PresentationCard from "./PresentationCard";

gql`
    fragment ManageSchedule_Presentation on schedule_Event {
        id
        conferenceId
        subconferenceId
        sessionEventId

        scheduledStartTime
        scheduledEndTime

        name
        itemId

        roomId

        item {
            ...ManageSchedule_EventContent
        }

        eventPeople {
            ...ManageSchedule_EventPerson
        }
    }

    query ManageSchedule_GetPresentations($sessionId: uuid!) {
        schedule_Event(
            where: { sessionEventId: { _eq: $sessionId } }
            order_by: [{ scheduledStartTime: asc_nulls_last }]
        ) {
            ...ManageSchedule_Presentation
        }
    }
`;

export default function PresentationsList({
    sessionId,
    tags,

    onCreate,
    onEdit,
    onDelete,

    refetchPresentations,
}: {
    sessionId: string;
    tags: ReadonlyArray<ManageSchedule_TagFragment>;

    onCreate: () => void;
    onEdit: (presentation: ManageSchedule_PresentationFragment, initialStepIdx?: number) => void;
    onDelete: (presentationId: string) => void;

    refetchPresentations?: React.MutableRefObject<(() => void) | null>;
}): JSX.Element {
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [presentationsResponse, refetch] = useManageSchedule_GetPresentationsQuery({
        variables: {
            sessionId,
        },
        context,
    });
    const presentations = presentationsResponse.data?.schedule_Event ?? [];
    useEffect(() => {
        if (refetchPresentations) {
            refetchPresentations.current = () => {
                refetch({
                    requestPolicy: "cache-and-network",
                });
            };
        }
    }, [refetch, refetchPresentations]);

    const { outlineColor } = useSelectorColors();

    return (
        <VStack pt={4} pl={24} alignItems="flex-start" w="100%" zIndex={1} spacing={4}>
            {presentationsResponse.fetching ? <Spinner /> : undefined}
            {presentations.length === 0
                ? undefined
                : presentations.map((presentation, idx) => (
                      <PresentationCard
                          key={idx}
                          presentation={presentation}
                          tags={tags}
                          onEdit={(idx) => onEdit(presentation, idx)}
                          onDelete={() => onDelete(presentation.id)}
                      />
                  ))}
            <Card
                variant="outline"
                isSelectable
                hideSelectButton
                w="100%"
                borderStyle="dashed"
                borderWidth={3}
                borderColor="gray.400"
                onClick={onCreate}
            >
                <Text
                    w="100%"
                    textAlign="center"
                    _groupHover={{
                        color: outlineColor,
                    }}
                    _groupActive={{
                        color: outlineColor,
                    }}
                    _groupFocus={{
                        color: outlineColor,
                    }}
                >
                    <FAIcon iconStyle="s" icon="plus" verticalAlign="middle" />{" "}
                    <chakra.span fontWeight="bold" verticalAlign="middle">
                        Add presentation
                    </chakra.span>
                </Text>
                <Box h={4}></Box>
            </Card>
            <Box h={4}>&nbsp;</Box>
        </VStack>
    );
}
