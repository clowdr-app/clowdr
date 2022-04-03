/* eslint-disable react/prop-types */
import type { BoxProps } from "@chakra-ui/react";
import { Button, chakra, Flex, Heading, HStack, IconButton, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import { Twemoji } from "react-emoji-render";
import { Link as ReactLink } from "react-router-dom";
import FAIcon from "../Chakra/FAIcon";
import SelectButton from "./SelectButton";
import useSelectorColors from "./useSelectorColors";

export interface CardProps extends BoxProps {
    isSelectable?: boolean;
    isSelected?: boolean;
    hideSelectButton?: boolean;
    isDisabled?: boolean;
    onSelectToggle?: () => void;

    onClick?: React.MouseEventHandler;
    to?: string;

    subHeading?: string;
    heading?: string;
    editControls?: React.ReactChild | React.ReactChildren | JSX.Element[];

    topLeftButton?: {
        label: string;
        colorScheme: string;
        iconStyle: "s" | "r";
        icon?: string;
        onClick?: () => void;
        variant: string;
        showLabel?: boolean;
    };
    rightButton?: {
        label: string;
        colorScheme: string;
        iconStyle: "s" | "r";
        icon: string;
        onClick: () => void;
        variant: string;
    };
    bottomButton?: {
        label: string;
        colorScheme: string;
        iconStyle: "s" | "r";
        icon: string;
        onClick: () => void;
        variant: string;
        showLabel?: boolean;
    };

    variant?: "solid" | "ghost" | "outline";

    contentPadding?: number;
}

const Card = React.forwardRef<HTMLDivElement, React.PropsWithChildren<CardProps>>(function Card(
    {
        isSelectable,
        isSelected,
        hideSelectButton,
        isDisabled = false,
        onSelectToggle,
        subHeading,
        heading,
        editControls,

        onClick,
        to,
        children,

        topLeftButton,
        rightButton,
        bottomButton,

        variant = "solid",

        contentPadding,

        ...props
    }: CardProps,
    ref
): JSX.Element {
    const borderColor = useColorModeValue("gray.100", "gray.700");
    const bgColor = useColorModeValue("white", "gray.700");

    const selectorColors = useSelectorColors();

    return (
        <Flex
            as={to ? ReactLink : undefined}
            to={to}
            ref={ref}
            role="group"
            overflow="visible"
            pos="relative"
            borderRadius={isSelected || variant === "solid" || variant === "outline" ? "2xl" : undefined}
            border={isSelected || variant === "solid" || variant === "outline" ? "2px solid" : undefined}
            borderColor={isSelected ? "blue.400" : borderColor}
            bgColor={isSelected ? selectorColors.bgColor : variant === "solid" ? bgColor : undefined}
            p={!isSelected && variant === "ghost" ? "1px" : undefined}
            cursor={to || isSelectable ? (isDisabled ? "not-allowed" : "pointer") : undefined}
            _hover={
                (to || isSelectable) && !isDisabled
                    ? {
                          shadow: "md",
                          borderRadius: "2xl",
                          borderColor: selectorColors.outlineColor,
                      }
                    : undefined
            }
            _active={
                (to || isSelectable) && !isDisabled
                    ? {
                          shadow: "md",
                          borderRadius: "2xl",
                      }
                    : undefined
            }
            _focus={
                (to || isSelectable) && !isDisabled
                    ? {
                          shadow: "md",
                          borderRadius: "2xl",
                      }
                    : undefined
            }
            transition="none"
            onClick={
                onClick ??
                (isSelectable && !isDisabled && onSelectToggle
                    ? (ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          onSelectToggle?.();
                      }
                    : undefined)
            }
            userSelect="none"
            tabIndex={onClick || to || isSelectable ? 0 : -1}
            {...props}
        >
            <Flex flexDir="column" w="100%">
                {topLeftButton ? (
                    topLeftButton.showLabel ? (
                        <Button
                            m={0}
                            size="sm"
                            colorScheme={topLeftButton.colorScheme}
                            alignSelf="stretch"
                            onClick={
                                topLeftButton?.onClick
                                    ? (ev) => {
                                          ev.stopPropagation();
                                          topLeftButton?.onClick?.();
                                      }
                                    : undefined
                            }
                            borderTopLeftRadius="2xl"
                            borderBottomRightRadius="2xl"
                            variant={topLeftButton.variant}
                            py={1}
                            h="min-content"
                            w="min-content"
                        >
                            {topLeftButton.icon ? (
                                <FAIcon
                                    iconStyle={topLeftButton.iconStyle}
                                    icon={topLeftButton.icon}
                                    mr={2}
                                    fontSize="sm"
                                />
                            ) : undefined}
                            <chakra.span>{topLeftButton.label}</chakra.span>
                        </Button>
                    ) : topLeftButton.icon ? (
                        <IconButton
                            m={0}
                            size="sm"
                            aria-label={topLeftButton.label}
                            icon={<FAIcon iconStyle={topLeftButton.iconStyle} icon={topLeftButton.icon} />}
                            colorScheme={topLeftButton.colorScheme}
                            alignSelf="stretch"
                            onClick={
                                topLeftButton?.onClick
                                    ? (ev) => {
                                          ev.stopPropagation();
                                          topLeftButton?.onClick?.();
                                      }
                                    : undefined
                            }
                            borderTopLeftRadius="2xl"
                            borderBottomRightRadius="2xl"
                            variant={topLeftButton.variant}
                            h="min-content"
                            w="min-content"
                        />
                    ) : undefined
                ) : undefined}
                <Flex>
                    {isSelectable && !hideSelectButton ? (
                        <SelectButton
                            isDisabled={isDisabled}
                            isSelected={isSelected ?? false}
                            onToggle={onSelectToggle}
                            borderTopLeftRadius="2xl"
                            top="-1px"
                            left="-1px"
                        />
                    ) : undefined}
                    <VStack
                        alignItems="flex-start"
                        m={contentPadding ?? 2}
                        mb={contentPadding ?? 1}
                        mt={topLeftButton ? (contentPadding ?? 2) / 2 : undefined}
                        flex="0 1 100%"
                        overflow="hidden"
                    >
                        <HStack alignItems="flex-start" w="100%" p="3px">
                            <VStack alignItems="flex-start" mr="auto">
                                {subHeading ? (
                                    <Text fontSize="md">
                                        <Twemoji className="twemoji" text={subHeading} />
                                    </Text>
                                ) : undefined}
                                {heading ? (
                                    <Heading as="h3" fontSize="lg" textAlign="left" fontWeight="semibold">
                                        <Twemoji className="twemoji" text={heading} />
                                    </Heading>
                                ) : undefined}
                            </VStack>
                            {!isSelected ? editControls : undefined}
                        </HStack>
                        {children}
                    </VStack>
                </Flex>
                {bottomButton ? (
                    bottomButton.showLabel ? (
                        <Button
                            mt={2}
                            h="auto"
                            colorScheme={bottomButton.colorScheme}
                            alignSelf="stretch"
                            onClick={(ev) => {
                                ev.stopPropagation();
                                bottomButton?.onClick();
                            }}
                            borderTopRadius={0}
                            borderBottomLeftRadius="2xl"
                            borderBottomRightRadius={rightButton ? 0 : "2xl"}
                            variant={bottomButton.variant}
                            p={1}
                        >
                            <FAIcon iconStyle={bottomButton.iconStyle} icon={bottomButton.icon} mr={2} fontSize="sm" />
                            <chakra.span>{bottomButton.label}</chakra.span>
                        </Button>
                    ) : (
                        <IconButton
                            mt={2}
                            aria-label={bottomButton.label}
                            icon={<FAIcon iconStyle={bottomButton.iconStyle} icon={bottomButton.icon} />}
                            h="auto"
                            colorScheme={bottomButton.colorScheme}
                            alignSelf="stretch"
                            onClick={(ev) => {
                                ev.stopPropagation();
                                bottomButton?.onClick();
                            }}
                            borderTopRadius={0}
                            borderBottomLeftRadius="2xl"
                            borderBottomRightRadius={rightButton ? 0 : "2xl"}
                            variant={bottomButton.variant}
                        />
                    )
                ) : undefined}
            </Flex>
            {rightButton ? (
                <IconButton
                    aria-label={rightButton.label}
                    icon={<FAIcon iconStyle={rightButton.iconStyle} icon={rightButton.icon} />}
                    h="auto"
                    colorScheme={rightButton.colorScheme}
                    alignSelf="stretch"
                    onClick={(ev) => {
                        ev.stopPropagation();
                        rightButton?.onClick();
                    }}
                    borderLeftRadius={0}
                    borderRightRadius="2xl"
                    right="-2px"
                    variant={rightButton.variant}
                />
            ) : undefined}
        </Flex>
    );
});

export default Card;
