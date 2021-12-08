import type { ButtonProps } from "@chakra-ui/react";
import { Box, Button, CircularProgress, Tooltip } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import FAIcon from "../../Chakra/FAIcon";
import { useChatConfiguration } from "../Configuration";
import { useComposeContext } from "./ComposeContext";

export default function SendLockoutButton({
    sendFailed,
    children,
    ...props
}: { sendFailed: boolean } & ButtonProps): JSX.Element {
    const config = useChatConfiguration();
    const compose = useComposeContext();
    const [showCheckMarkParams, setShowCheckMarkParams] = useState<{
        time: number;
        error: boolean;
    }>({ time: 0, error: false });
    // const now = useRealTime(100);

    const lockoutTimeMs = useMemo(() => {
        switch (compose.newMessageType) {
            case Chat_MessageType_Enum.Message:
                return config.messageConfig.sendCooloffPeriodMs;
            case Chat_MessageType_Enum.Emote:
                return config.emoteConfig.sendCooloffPeriodMs;
            case Chat_MessageType_Enum.Question:
                return config.questionConfig.sendCooloffPeriodMs;
            case Chat_MessageType_Enum.Answer:
                return config.answerConfig.sendCooloffPeriodMs;
            case Chat_MessageType_Enum.Poll:
                return config.pollConfig.sendCooloffPeriodMs;
            default:
                return config.messageConfig.sendCooloffPeriodMs;
        }
    }, [
        compose.newMessageType,
        config.answerConfig.sendCooloffPeriodMs,
        config.emoteConfig.sendCooloffPeriodMs,
        config.messageConfig.sendCooloffPeriodMs,
        config.pollConfig.sendCooloffPeriodMs,
        config.questionConfig.sendCooloffPeriodMs,
    ]);

    const isLockedOut = false; // !!lockoutTimeMs && compose.lastSendTime + lockoutTimeMs > now;

    useEffect(() => {
        if ((sendFailed || props.isDisabled) && props.isLoading) {
            setShowCheckMarkParams({ time: Date.now(), error: sendFailed });
        }
    }, [props.isDisabled, props.isLoading, sendFailed]);
    // const showCheckMarkFor = 2000;
    const showingCheckMark = false; // showCheckMarkParams.time + showCheckMarkFor > now;

    // const showCheckMarkProgress = Math.abs(now - showCheckMarkParams.time) / showCheckMarkFor;
    const checkMarkOpacity = 0; // showCheckMarkProgress < 0.5 ? 0.3 + 1.4 * showCheckMarkProgress : 2 * (1 - showCheckMarkProgress);

    return (
        <Tooltip
            label={
                showingCheckMark
                    ? showCheckMarkParams.error
                        ? "Failed"
                        : "Succeeded"
                    : isLockedOut
                    ? "Please wait"
                    : undefined
            }
        >
            <Box>
                <Button
                    {...props}
                    color={showingCheckMark ? (showCheckMarkParams.error ? "red.300" : props.color) : props.color}
                    isDisabled={showingCheckMark || props.isDisabled || isLockedOut}
                    _disabled={{
                        opacity: false, // showingCheckMark && showCheckMarkProgress < 0.95 ? 1 : 0.4,
                        boxShadow: "none",
                        cursor: "progress",
                    }}
                >
                    {showingCheckMark ? (
                        <FAIcon
                            iconStyle="s"
                            icon={showCheckMarkParams.error ? "times-circle" : "check-circle"}
                            opacity={checkMarkOpacity}
                        />
                    ) : isLockedOut ? (
                        <CircularProgress
                            size="4"
                            min={0}
                            max={(lockoutTimeMs ?? 200) - 200}
                            value={0} // now - compose.lastSendTime}
                        />
                    ) : (
                        children
                    )}
                </Button>
            </Box>
        </Tooltip>
    );
}
