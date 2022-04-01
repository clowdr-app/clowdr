import {
    Button,
    ButtonGroup,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo, useState } from "react";
import { gql } from "urql";
import { useManageSchedule_ShiftTimesMutation } from "../../../../../generated/graphql";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";

gql`
    # query ManageSchedule_GetEarliestEventTime($ids: [uuid!]!) {
    #     schedule_Event(where: { id: { _in: $ids } }, order_by: [{ scheduledStartTime: asc }], limit: 1) {
    #         id
    #         scheduledStartTime
    #         name
    #         item {
    #             id
    #             title
    #         }
    #     }
    # }

    mutation ManageSchedule_ShiftTimes($ids: _uuid, $minutes: Int!) {
        schedule_shiftTimes(args: { eventIds: $ids, minutes: $minutes }) {
            id
        }
    }
`;

export default function ShiftTimesModal(props: {
    isOpen: boolean;
    onClose: (didShift: boolean) => void;
    eventIds: string[];
}): JSX.Element {
    if (props.isOpen) {
        return <ShiftTimesModalInner {...props} />;
    }
    return <></>;
}

function ShiftTimesModalInner({
    isOpen,
    onClose,
    eventIds,
}: {
    isOpen: boolean;
    onClose: (didShift: boolean) => void;
    eventIds: string[];
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

    const [shiftTimesResponse, shiftTimes] = useManageSchedule_ShiftTimesMutation();

    const [minutes, setMinutes] = useState<number>(60);
    const [minutesStr, setMinutesStr] = useState<string>("60");

    // TODO: Prevent creation of overlapping events

    return (
        <Modal size="2xl" isOpen={isOpen} onClose={() => onClose(false)}>
            <ModalOverlay />
            <ModalContent>
                <ModalCloseButton />
                <ModalHeader>
                    Shift times of {eventIds.length} session{eventIds.length === 1 ? "" : "s"}
                </ModalHeader>
                <ModalBody>
                    <FormControl id="shift-minutes-distance">
                        <FormLabel>Distance (minutes)</FormLabel>
                        <Input
                            type="number"
                            value={minutesStr}
                            onChange={(ev) => {
                                setMinutes(ev.target.valueAsNumber);
                                setMinutesStr(ev.target.value);
                            }}
                        />
                        <FormHelperText>
                            The number of minutes you would like to shift the events. Use negative numbers to move
                            events earlier in time (a shift from 11am to 10am is -60 minutes).
                        </FormHelperText>
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <ButtonGroup>
                        <Button
                            variant="outline"
                            colorScheme="blue"
                            onClick={() => onClose(false)}
                            isDisabled={shiftTimesResponse.fetching}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            colorScheme="PrimaryActionButton"
                            onClick={async () => {
                                await shiftTimes(
                                    {
                                        minutes,
                                        ids: `{${eventIds
                                            .reduce((acc, x) => `${acc},"${x.replace(/"/g, '\\"')}"`, "")
                                            .substring(1)}}`,
                                    },
                                    context
                                );
                                onClose(true);
                            }}
                            isLoading={shiftTimesResponse.fetching}
                            isDisabled={parseInt(minutesStr) !== minutes}
                        >
                            Shift times
                        </Button>
                    </ButtonGroup>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
