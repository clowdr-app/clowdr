import { Badge, BadgeProps } from "@chakra-ui/react";
import React from "react";

export interface BadgeData {
    name: string;
    colour: string;
}

export default function ProfileBadge({
    badge,
    onClick,
    ...rest
}: { badge: BadgeData; onClick?: () => void } & BadgeProps): JSX.Element {
    return (
        <Badge
            color="gray.50"
            backgroundColor={badge.colour.length > 0 && badge.colour !== "rgba(0,0,0,0)" ? badge.colour : undefined}
            borderColor={badge.colour}
            variant="subtle"
            cursor={onClick ? "pointer" : undefined}
            onClick={onClick}
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
            _focus={
                onClick
                    ? ({
                          outlineWidth: "3px",
                          outlineStyle: "solid",
                          outlineOffset: "0 0 0",
                          outlineColor: "focus.400",
                      } as any)
                    : undefined
            }
            {...rest}
        >
            {badge.name}
        </Badge>
    );
}
