import type { BadgeProps} from "@chakra-ui/react";
import { Badge, Text, Tooltip, useColorModeValue } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import { useRegistrants } from "../../Conference/RegistrantsContext";

export default function ReactionBadge({
    reaction,
    senderIds,
    currentRegistrantId,
    onClick,
    ...rest
}: {
    reaction: string;
    senderIds: string[];
    onClick?: () => void;
    currentRegistrantId?: string;
} & BadgeProps): JSX.Element {
    const color = useColorModeValue("ChatReaction.textColor-light", "ChatReaction.textColor-dark");
    const borderColor = useColorModeValue("ChatReaction.borderColor-light", "ChatReaction.borderColor-dark");
    const defaultBgColor = useColorModeValue(
        "ChatReaction.backgroundColor-Sender-light",
        "ChatReaction.backgroundColor-Sender-dark"
    );
    const senderIdObjs = useMemo(() => senderIds.map((x) => ({ registrant: x })), [senderIds]);
    const registrants = useRegistrants(senderIdObjs);
    const names = useMemo(() => {
        return R.sortBy((x) => x.displayName, registrants)
            .reduce((acc, registrant) => acc + ", " + registrant.displayName, "")
            .slice(2);
    }, [registrants]);
    return (
        <Tooltip label={names} fontSize="xs" whiteSpace="normal" overflow="auto">
            <Badge
                color={color}
                backgroundColor={
                    currentRegistrantId && senderIds.includes(currentRegistrantId) ? defaultBgColor : "none"
                }
                border="1px solid"
                borderColor={borderColor}
                variant="subtle"
                borderRadius="1000px"
                fontSize="inherit"
                cursor={onClick ? "pointer" : undefined}
                onClick={onClick}
                transition="background-color 0.2s linear"
                onKeyUp={
                    onClick
                        ? (ev) => {
                              if (ev.key === " " || ev.key === "Enter") {
                                  onClick();
                              }
                          }
                        : undefined
                }
                tabIndex={onClick ? 0 : undefined}
                userSelect="none"
                _hover={{
                    backgroundColor:
                        currentRegistrantId && senderIds.includes(currentRegistrantId) ? "red.400" : "purple.400",
                }}
                _focus={
                    onClick
                        ? ({
                              outlineWidth: "3px",
                              outlineStyle: "solid",
                              outlineOffset: "0 0 0",
                              outlineColor: "focus.400",
                              backgroundColor:
                                  currentRegistrantId && senderIds.includes(currentRegistrantId)
                                      ? "red.400"
                                      : "purple.400",
                          } as any)
                        : undefined
                }
                {...rest}
            >
                <Text as="span" fontSize="inherit" ml="2px">
                    <Twemoji className="twemoji twemoji-reaction" text={reaction} />
                </Text>
                <Text as="span" mx="2px" fontSize="inherit">
                    {senderIds.length}
                </Text>
            </Badge>
        </Tooltip>
    );
}
