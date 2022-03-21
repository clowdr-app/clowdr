import { Button, Code, Table, Tbody, Td, Text, Tr, useClipboard, VStack } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import { gql } from "urql";
import { useGetRoomRtmpInputQuery } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { makeContext } from "../../../GQL/make-context";

gql`
    query GetRoomRtmpInput($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            rtmpInput {
                id
                address
                applicationName
                applicationInstance
            }
        }
    }
`;

export default function ExternalRtmpInputEditor({ roomId }: { roomId: string }): JSX.Element {
    const { conferencePath, subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
                [AuthHeader.RoomId]: roomId,
            }),
        [roomId, subconferenceId]
    );
    const [rtmpInputResponse] = useGetRoomRtmpInputQuery({
        variables: {
            roomId,
        },
        requestPolicy: "network-only",
        context,
    });

    // TODO: Follow the same model as ExternalRTMPBroadcastEditor to insert an RoomRtmpInput record for the room

    const input = rtmpInputResponse.data?.room_Room_by_pk?.rtmpInput;
    const fullUrl = input ? `rtmp://${input.address}/${input.applicationName}/${input.applicationInstance}` : undefined;
    const streamUrl = input ? `rtmp://${input.address}/${input.applicationName}` : undefined;
    const watchPageUrl = input ? `${window.location.origin}${conferencePath}/room/${roomId}` : undefined;

    const { onCopy: onCopyFullUrl, hasCopied: hasCopiedFullUrl } = useClipboard(fullUrl ?? "");
    const { onCopy: onCopyStreamUrl, hasCopied: hasCopiedStreamUrl } = useClipboard(streamUrl ?? "");
    const { onCopy: onCopyWatchPageUrl, hasCopied: hasCopiedWatchPageUrl } = useClipboard(watchPageUrl ?? "");
    const { onCopy: onCopyAppInstance, hasCopied: hasCopiedAppInstance } = useClipboard(
        input?.applicationInstance ?? ""
    );

    return input?.address ? (
        <VStack alignItems="flex-start" spacing={4}>
            <Text>
                The following input details support RTMP Push up to 1080p@30fps. The input becomes active in the 5
                minutes before the scheduled time of a livestream event scheduled in this room. When the input is
                inactive you will not be able to connect a stream to it.
            </Text>
            <Table size="sm">
                <Tbody>
                    <Tr>
                        <Td fontWeight="bold">Full URL</Td>
                        <Td>{fullUrl}</Td>
                        <Td>
                            <Button onClick={onCopyFullUrl} size="xs" ml="auto" minW="2.5em">
                                <FAIcon iconStyle="s" icon={hasCopiedFullUrl ? "check-circle" : "clipboard"} />
                            </Button>
                        </Td>
                    </Tr>
                    <Tr>
                        <Td fontWeight="bold">Stream URL</Td>
                        <Td>{streamUrl}</Td>
                        <Td>
                            <Button onClick={onCopyStreamUrl} size="xs" ml="auto" minW="2.5em">
                                <FAIcon iconStyle="s" icon={hasCopiedStreamUrl ? "check-circle" : "clipboard"} />
                            </Button>
                        </Td>
                    </Tr>
                    <Tr>
                        <Td fontWeight="bold">Stream Key</Td>
                        <Td>{input.applicationInstance}</Td>
                        <Td>
                            <Button onClick={onCopyAppInstance} size="xs" ml="auto" minW="2.5em">
                                <FAIcon iconStyle="s" icon={hasCopiedAppInstance ? "check-circle" : "clipboard"} />
                            </Button>
                        </Td>
                    </Tr>
                    <Tr>
                        <Td fontWeight="bold">Watch Page URL</Td>
                        <Td>{watchPageUrl}</Td>
                        <Td>
                            <Button onClick={onCopyWatchPageUrl} size="xs" ml="auto" minW="2.5em">
                                <FAIcon iconStyle="s" icon={hasCopiedWatchPageUrl ? "check-circle" : "clipboard"} />
                            </Button>
                        </Td>
                    </Tr>
                </Tbody>
            </Table>
        </VStack>
    ) : (
        <VStack alignItems="flex-start" spacing={4}>
            <Text>
                Please contact support to request configuration of a hybrid room (external RTMP input) quoting your
                conference name and the following room identifer.
            </Text>
            <Code>{roomId}</Code>
            <Text>
                Please submit your request at least 48 hours prior to the start of your first hybrid session (though we
                recommend allowing additional time to organize a test stream).
            </Text>
        </VStack>
    );
}
