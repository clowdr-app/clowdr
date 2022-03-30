import {
    Checkbox,
    FormControl,
    FormHelperText,
    FormLabel,
    ListItem,
    Select,
    UnorderedList,
    VStack,
} from "@chakra-ui/react";
import React, { useEffect, useMemo } from "react";
import type { ManageSchedule_SessionFragment } from "../../../../../generated/graphql";
import { Schedule_Mode_Enum } from "../../../../../generated/graphql";
import type { PanelProps } from "../../../../CRUDCards/Types";
import type { ScheduleEditorRecord } from "./ScheduleEditorRecord";

function modeToLabel(mode: Schedule_Mode_Enum): string {
    switch (mode) {
        case Schedule_Mode_Enum.Exhibition:
            return "Breakout video-chat (exhibition)";
        case Schedule_Mode_Enum.External:
            return "External (e.g. Zoom, MS Teams or other platforms)";
        case Schedule_Mode_Enum.Livestream:
            return "Live-stream";
        case Schedule_Mode_Enum.None:
            return "No interaction";
        case Schedule_Mode_Enum.Shuffle:
            return "Networking";
        case Schedule_Mode_Enum.VideoChat:
            return "Video-chat";
        case Schedule_Mode_Enum.VideoPlayer:
            return "Video player (unmonitored session mirroring)";
    }
}

export default function SettingsPanel({ record, ...props }: PanelProps<ScheduleEditorRecord>): JSX.Element {
    if ("sessionEventId" in record && record.sessionEventId) {
        return <>No settings to configure.</>;
    }
    return <SessionSettingsPanel record={record} {...props} />;
}

function SessionSettingsPanel({
    isCreate: _isCreate,
    isDisabled: _isDisabled,
    clearState: _clearState,
    firstInputRef: _firstInputRef,
    record,
    updateRecord,
    onValid: _onValid,
    onInvalid: _onInvalid,
    onAnyChange,
}: PanelProps<ManageSchedule_SessionFragment>): JSX.Element {
    const selectableModes = useMemo<Schedule_Mode_Enum[]>(
        () => [
            Schedule_Mode_Enum.VideoChat,
            Schedule_Mode_Enum.Livestream,
            Schedule_Mode_Enum.External,
            Schedule_Mode_Enum.VideoPlayer,
            Schedule_Mode_Enum.None,
        ],
        []
    );

    useEffect(() => {
        if (!record.modeName) {
            onAnyChange();
            updateRecord((old) => ({ ...old, modeName: Schedule_Mode_Enum.VideoChat }));
        }
    }, [onAnyChange, record.modeName, updateRecord]);

    return (
        <VStack spacing={6} p={0}>
            {!record.modeName || selectableModes.includes(record.modeName) ? (
                <FormControl id="editor-session-mode">
                    <FormLabel>Interaction mode</FormLabel>
                    <Select
                        value={record.modeName ?? Schedule_Mode_Enum.VideoChat}
                        onChange={(ev) => {
                            onAnyChange();
                            updateRecord((old) => ({ ...old, modeName: ev.target.value as Schedule_Mode_Enum }));
                        }}
                    >
                        {selectableModes.map((mode) => (
                            <option key={mode} value={mode}>
                                {modeToLabel(mode)}
                            </option>
                        ))}
                    </Select>
                    <FormHelperText>
                        Determines the way attendees and speakers will interact during this event.
                    </FormHelperText>
                </FormControl>
            ) : undefined}
            {/* TODO: auto play element id */}
            {record.modeName === Schedule_Mode_Enum.Livestream || record.modeName === Schedule_Mode_Enum.VideoChat ? (
                <FormControl id="editor-session-recording">
                    <FormLabel>Automatic recording?</FormLabel>
                    <Checkbox
                        isChecked={record.enableRecording}
                        onChange={(ev) => {
                            onAnyChange();
                            updateRecord((old) => ({ ...old, enableRecording: ev.target.checked }));
                        }}
                    />
                    <FormHelperText>
                        Check to enable automatic recording for this session.
                        <UnorderedList>
                            <ListItem
                                fontWeight={record.modeName === Schedule_Mode_Enum.VideoChat ? "bold" : undefined}
                            >
                                For video-chat events, recording can also be started/stopped manually during the
                                session.
                            </ListItem>
                            <ListItem
                                fontWeight={record.modeName === Schedule_Mode_Enum.Livestream ? "bold" : undefined}
                            >
                                For live-stream events, recording cannot be manually controlled - this option is the
                                only way to enable recording.
                            </ListItem>
                        </UnorderedList>
                    </FormHelperText>
                </FormControl>
            ) : undefined}
            <FormControl id="editor-session-participation-survey">
                <FormLabel>Automatic participation survey?</FormLabel>
                <Checkbox
                    isChecked={record.automaticParticipationSurvey}
                    onChange={(ev) => {
                        onAnyChange();
                        updateRecord((old) => ({ ...old, automaticParticipationSurvey: ev.target.checked }));
                    }}
                />
                <FormHelperText>
                    Check to automatically post a participation survey in the chat at the end of the session.
                    <br />
                    <br />
                    The survey remains open for 5 minutes and allows attendees to log their attendance, provide a rating
                    on a 5-point scale, and leave a private comment.
                </FormHelperText>
            </FormControl>
        </VStack>
    );
}
