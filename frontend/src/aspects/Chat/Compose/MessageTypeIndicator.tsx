import type { TagProps } from "@chakra-ui/react";
import { chakra, Tag, Tooltip } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import FAIcon from "../../Chakra/FAIcon";

export function MessageTypeIndicator({
    messageType,
    showName,
    ...props
}: TagProps & { showName?: boolean; messageType: Chat_MessageType_Enum }): JSX.Element {
    const { indicator, name } = useMemo(() => {
        switch (messageType) {
            case Chat_MessageType_Enum.Message:
                return { indicator: <FAIcon iconStyle="s" icon="envelope" />, name: "Message" };
            case Chat_MessageType_Enum.Question:
                return { indicator: <FAIcon iconStyle="s" icon="question-circle" />, name: "Question" };
            case Chat_MessageType_Enum.Answer:
                return { indicator: <FAIcon iconStyle="s" icon="check-circle" />, name: "Answer" };
            case Chat_MessageType_Enum.Poll:
                return { indicator: <FAIcon iconStyle="s" icon="poll" />, name: "Poll" };
            case Chat_MessageType_Enum.EventStart:
                return { indicator: <FAIcon iconStyle="s" icon="calendar" />, name: "Event start" };
            case Chat_MessageType_Enum.ParticipationSurvey:
                return { indicator: <FAIcon iconStyle="s" icon="calendar-check" />, name: "Participation survey" };
            default:
                return {
                    indicator: <FAIcon iconStyle="s" icon="exclamation-circle" />,
                    name: "Unrecognised message type",
                };
        }
    }, [messageType]);

    const tag = useMemo(
        () => (
            <Tag
                aria-label={name}
                minW={0}
                minH={0}
                border="none"
                background="none"
                m={0}
                p={0}
                fontSize="inherit"
                {...props}
            >
                {indicator}
                {showName ? <chakra.span ml={2}>{name}</chakra.span> : undefined}
            </Tag>
        ),
        [indicator, name, props, showName]
    );

    return !showName ? <Tooltip label={name}>{tag}</Tooltip> : tag;
}
