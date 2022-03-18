import type { BadgeProps } from "@chakra-ui/react";
import { Badge } from "@chakra-ui/react";
import React from "react";
import Color from "tinycolor2";
import { z } from "zod";

export const badgeData = z.object({
    name: z.string(),
    colour: z.string(),
});

export type BadgeData = z.infer<typeof badgeData>;

export default function ProfileBadge({
    badge,
    onClick,
    ...rest
}: { badge: BadgeData; onClick?: () => void } & BadgeProps): JSX.Element {
    return (
        <Badge
            borderRadius={2}
            colorScheme="ProfileBadge-Default"
            backgroundColor={badge.colour.length > 0 && badge.colour !== "rgba(0,0,0,0)" ? badge.colour : undefined}
            borderColor={badge.colour}
            color={Color(badge.colour).isDark() ? "ProfileBadge.textColor-dark" : "ProfileBadge.textColor-light"}
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
            textTransform="none"
            lineHeight="1.5em"
            py="2px"
            {...rest}
        >
            {badge.name}
        </Badge>
    );
}
