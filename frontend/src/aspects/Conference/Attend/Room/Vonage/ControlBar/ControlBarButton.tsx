import { CheckCircleIcon } from "@chakra-ui/icons";
import { Button, Tag, TagLabel, TagLeftIcon, Tooltip } from "@chakra-ui/react";
import React, { useMemo } from "react";
import FAIcon from "../../../../../Chakra/FAIcon";
import { StateType } from "../State/VonageGlobalState";
import { useVonageGlobalState } from "../State/VonageGlobalStateProvider";

export interface IconProps {
    icon: string;
    style: "b" | "s" | "r";
}

interface ControlBarButtonProps {
    label:
        | string
        | {
              active: string;
              inactive: string;
          };
    text?:
        | string
        | {
              active: string;
              inactive: string;
          };
    icon: string | IconProps | { active: string | IconProps; inactive: string | IconProps };

    isVisible?: boolean;
    isLoading?: boolean;
    isActive?: boolean;
    isEnabled?: boolean;
    isLimited?: false | string;
    isDestructive?: boolean;

    onClick: (() => void) | { active: () => void; inactive: () => void };
}

export const ControlBarButton = React.forwardRef<HTMLButtonElement, ControlBarButtonProps>(function ControlBarButton(
    {
        label,
        text,
        icon,
        isVisible = true,
        isLoading = false,
        isActive,
        isEnabled = true,
        isLimited = false,
        isDestructive = false,
        onClick,
    }: ControlBarButtonProps,
    ref
): JSX.Element {
    const iconProps = useMemo(
        () =>
            typeof icon === "string"
                ? ({ icon, style: "s" } as IconProps)
                : "active" in icon
                ? isActive
                    ? typeof icon.active === "string"
                        ? ({ icon: icon.active, style: "s" } as IconProps)
                        : icon.active
                    : typeof icon.inactive === "string"
                    ? ({ icon: icon.inactive, style: "s" } as IconProps)
                    : icon.inactive
                : icon,
        [icon, isActive]
    );
    const labelValue = typeof label === "string" ? label : isActive ? label.active : label.inactive;
    const textValue = text && (typeof text === "string" ? text : isActive ? text.active : text.inactive);
    const onClickValue = typeof onClick === "function" ? onClick : isActive ? onClick.active : onClick.inactive;
    const vonage = useVonageGlobalState();

    return isVisible ? (
        isLimited ? (
            <Tag
                size="sm"
                variant="outline"
                colorScheme="RoomControlBarNotice"
                px={2}
                py="4px"
                ml={1}
                mr="auto"
                maxW="190px"
                ref={ref}
            >
                <TagLeftIcon as={CheckCircleIcon} />
                <TagLabel whiteSpace="normal">{isLimited}</TagLabel>
            </Tag>
        ) : (
            <Tooltip label={labelValue}>
                <Button
                    size="sm"
                    isLoading={isLoading}
                    leftIcon={<FAIcon iconStyle={iconProps.style} icon={iconProps.icon} />}
                    iconSpacing={vonage.state.type === StateType.Connected ? 0 : undefined}
                    onClick={onClickValue}
                    isDisabled={!isEnabled}
                    colorScheme={
                        isActive === undefined
                            ? "RoomControlBarButton"
                            : isActive
                            ? isDestructive
                                ? "DestructiveActionButton"
                                : "ActiveRoomControlBarButton"
                            : "InactiveRoomControlBarButton"
                    }
                    aria-label={labelValue}
                    w={vonage.state.type === StateType.Connected ? "2.5em" : undefined}
                    ref={ref}
                >
                    {vonage.state.type === StateType.Connected ? "" : textValue}
                </Button>
            </Tooltip>
        )
    ) : (
        <></>
    );
});
