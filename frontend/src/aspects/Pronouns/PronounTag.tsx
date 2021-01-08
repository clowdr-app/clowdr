import { Badge, BadgeProps } from "@chakra-ui/react";
import React from "react";

export default function PronounTag({
    pronoun,
    onClick,
    ...rest
}: { pronoun: string; onClick?: () => void } & BadgeProps): JSX.Element {
    return (
        <Badge
            colorScheme="gray"
            variant="outline"
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
            {pronoun}
        </Badge>
    );
}
