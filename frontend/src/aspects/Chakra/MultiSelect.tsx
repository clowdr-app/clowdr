/* eslint-disable no-underscore-dangle */
// See: https://github.com/chakra-ui/chakra-ui/issues/1293#issuecomment-813453683
// Source gist: https://gist.github.com/csandman/c687a9fb4275112f281ab9a5701457e4
// Demo: https://codesandbox.io/s/chakra-ui-react-select-648uv?file=/multi-select.js

import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    BoxProps,
    Center,
    CenterProps,
    ChakraProps,
    CloseButton,
    CloseButtonProps,
    Divider,
    DividerProps,
    Flex,
    FlexProps,
    StylesProvider,
    Tag,
    TagCloseButton,
    TagCloseButtonProps,
    TagLabel,
    TagLabelProps,
    TagProps,
    useColorModeValue,
    useMultiStyleConfig,
    useStyles,
    useTheme,
    useToken,
} from "@chakra-ui/react";
import React from "react";
import Select, { components as selectComponents, MenuProps, Props as SelectProps, Theme } from "react-select";

const chakraStyles = {
    input: (provided: any) => ({
        ...provided,
        color: "inherit",
        lineHeight: 1,
    }),
    menu: (provided: any) => ({
        ...provided,
        boxShadow: "none",
    }),
    valueContainer: (provided: any) => ({
        ...provided,
        padding: "0.125rem 1rem",
    }),
    control: () => ({}),
    menuList: () => ({}),
    option: () => ({}),
    multiValue: () => ({}),
    multiValueLabel: () => ({}),
    multiValueRemove: () => ({}),
    group: () => ({}),
};

const chakraComponents = {
    // Control components
    Control: function Control({
        children,
        innerRef,
        innerProps,
        isDisabled,
        isFocused,
        ...props
    }: ChakraProps &
        React.PropsWithChildren<{
            innerRef?: React.LegacyRef<HTMLDivElement> | undefined;
            innerProps?: FlexProps;
            isDisabled?: boolean;
            isFocused?: boolean;
        }>) {
        const inputStyles = useMultiStyleConfig("Input", props);
        return (
            <StylesProvider value={inputStyles}>
                <Flex
                    ref={innerRef}
                    sx={{
                        ...inputStyles.field,
                        p: 0,
                        overflow: "hidden",
                        h: "auto",
                        minH: 10,
                    }}
                    {...innerProps}
                    {...(isFocused && { "data-focus": true })}
                    {...(isDisabled && { disabled: true })}
                >
                    {children}
                </Flex>
            </StylesProvider>
        );
    },
    MultiValueContainer: function MultiValueContainer({
        children,
        innerRef,
        innerProps,
        data: { isFixed },
    }: ChakraProps &
        React.PropsWithChildren<{
            innerRef?: React.LegacyRef<HTMLDivElement> | undefined;
            innerProps?: TagProps;
            data: { isFixed: boolean };
        }>) {
        return (
            <Tag ref={innerRef} {...innerProps} m="0.125rem" variant={isFixed ? "solid" : "subtle"}>
                {children}
            </Tag>
        );
    },
    MultiValueLabel: function MultiValueLabel({
        children,
        innerRef,
        innerProps,
    }: ChakraProps &
        React.PropsWithChildren<{
            innerRef?: React.LegacyRef<HTMLDivElement> | undefined;
            innerProps?: TagLabelProps;
        }>) {
        return (
            <TagLabel ref={innerRef} {...innerProps}>
                {children}
            </TagLabel>
        );
    },
    MultiValueRemove: function MultiValueRemove({
        children,
        innerProps,
        data: { isFixed },
    }: ChakraProps &
        React.PropsWithChildren<{
            innerProps?: TagCloseButtonProps;
            data: { isFixed: boolean };
        }>) {
        if (isFixed) {
            return null;
        }

        return <TagCloseButton {...innerProps}>{children}</TagCloseButton>;
    },
    IndicatorSeparator: function IndicatorSeparator({
        innerRef,
        innerProps,
    }: ChakraProps &
        React.PropsWithChildren<{
            innerRef?: React.LegacyRef<HTMLHRElement> | undefined;
            innerProps?: DividerProps;
        }>) {
        return <Divider ref={innerRef} {...innerProps} orientation="vertical" opacity="1" />;
    },
    ClearIndicator: function ClearIndicator({
        innerRef,
        innerProps,
    }: ChakraProps &
        React.PropsWithChildren<{
            innerRef?: React.LegacyRef<HTMLButtonElement> | undefined;
            innerProps?: CloseButtonProps;
        }>) {
        return <CloseButton ref={innerRef} {...innerProps} size="sm" mx={2} />;
    },
    DropdownIndicator: function DropdownIndicator({
        innerRef,
        innerProps,
    }: ChakraProps &
        React.PropsWithChildren<{
            innerRef?: React.LegacyRef<HTMLDivElement> | undefined;
            innerProps?: CenterProps;
        }>) {
        const { addon } = useStyles();

        return (
            <Center
                ref={innerRef}
                {...innerProps}
                sx={{
                    ...addon,
                    h: "100%",
                    borderRadius: 0,
                    borderWidth: 0,
                    cursor: "pointer",
                }}
            >
                <ChevronDownIcon h={5} w={5} />
            </Center>
        );
    },
    // Menu components
    Menu: function Menu({ children, ...props }: ChakraProps & React.PropsWithChildren<MenuProps<any, any, any>>) {
        const menuStyles = useMultiStyleConfig("Menu", props);
        return (
            <selectComponents.Menu {...(props as any)}>
                <StylesProvider value={menuStyles}>{children}</StylesProvider>
            </selectComponents.Menu>
        );
    },
    MenuList: function MenuList({
        innerRef,
        innerProps,
        children,
        maxHeight,
    }: ChakraProps &
        React.PropsWithChildren<{
            innerRef?: React.LegacyRef<HTMLDivElement> | undefined;
            innerProps?: BoxProps;
        }>) {
        const { list } = useStyles();
        return (
            <Box
                sx={{
                    ...list,
                    maxH: `${maxHeight}px`,
                    overflowY: "auto",
                }}
                ref={innerRef}
                {...innerProps}
            >
                {children}
            </Box>
        );
    },
    GroupHeading: function GroupHeading({
        innerProps,
        children,
    }: ChakraProps &
        React.PropsWithChildren<{
            innerProps?: BoxProps;
        }>) {
        const { groupTitle } = useStyles();
        return (
            <Box sx={groupTitle} {...innerProps}>
                {children}
            </Box>
        );
    },
    Option: function Option({
        innerRef,
        innerProps,
        children,
        isFocused,
        isDisabled,
    }: ChakraProps &
        React.PropsWithChildren<{
            innerRef?: React.LegacyRef<HTMLDivElement> | undefined;
            innerProps?: BoxProps;
            isFocused?: boolean;
            isDisabled?: boolean;
        }>) {
        const { item } = useStyles();
        return (
            <Box
                as="button"
                sx={{
                    ...item,
                    w: "100%",
                    textAlign: "left",
                    bg: isFocused ? (item as any)._focus.bg : "transparent",
                    ...(isDisabled && (item as any)._disabled),
                }}
                ref={innerRef}
                {...innerProps}
                {...(isDisabled && { disabled: true })}
            >
                {children}
            </Box>
        );
    },
};

export default function MultiSelect({
    name = "",
    styles = {},
    components = {},
    theme = {
        borderRadius: 0,
        colors: {},
        spacing: {
            baseUnit: 1,
            controlHeight: 1,
            menuGutter: 0,
        },
    },
    ...props
}: SelectProps<{ label: string; value: string }, true>): JSX.Element {
    const chakraTheme = useTheme();
    const placeholderColorChakra = useColorModeValue("Input.textColor-light", "Input.textColor-dark");
    const placeholderColor = useToken("colors", placeholderColorChakra);

    const th =
        typeof theme === "function"
            ? theme({
                  borderRadius: 0,
                  colors: {},
                  spacing: {
                      baseUnit: 1,
                      controlHeight: 1,
                      menuGutter: 0,
                  },
              } as Theme)
            : theme;
    return (
        <Select
            isMulti
            closeMenuOnSelect={false}
            menuShouldScrollIntoView={false}
            menuPortalTarget={document.body}
            menuPosition="absolute"
            isClearable
            isSearchable
            name={name}
            components={{
                ...chakraComponents,
                ...components,
            }}
            styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                ...chakraStyles,
                ...styles,
            }}
            theme={(baseTheme) => ({
                ...baseTheme,
                borderRadius: chakraTheme.radii.md,
                colors: {
                    ...baseTheme.colors,
                    neutral50: placeholderColor, // placeholder text color
                    neutral40: placeholderColor, // noOptionsMessage color
                    ...th.colors,
                },
                spacing: {
                    ...baseTheme.spacing,
                    ...th.spacing,
                },
            })}
            {...props}
        />
    );
}
