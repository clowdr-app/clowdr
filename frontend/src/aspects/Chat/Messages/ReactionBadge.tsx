import { Badge, BadgeProps, Text } from "@chakra-ui/react";
import React from "react";
import { Twemoji } from "react-emoji-render";

export default function ReactionBadge({
    reaction,
    count,
    onClick,
    ...rest
}: { reaction: string; count: number; onClick?: () => void } & BadgeProps): JSX.Element {
    return (
        <Badge
            color="gray.50"
            backgroundColor="gray.600"
            borderColor="none"
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
                backgroundColor: "gray.400",
            }}
            _focus={
                onClick
                    ? ({
                          outlineWidth: "3px",
                          outlineStyle: "solid",
                          outlineOffset: "0 0 0",
                          outlineColor: "focus.400",
                          backgroundColor: "gray.400",
                      } as any)
                    : undefined
            }
            {...rest}
        >
            <Text as="span" fontSize="inherit" ml="2px">
                <Twemoji className="twemoji twemoji-reaction" text={reaction} />
            </Text>
            <Text as="span" mx="2px" fontSize="inherit">
                {count}
            </Text>
        </Badge>
    );
}
