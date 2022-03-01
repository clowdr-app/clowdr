/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ButtonGroup, IconButton } from "@chakra-ui/react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import FAIcon from "../Chakra/FAIcon";
import Card from "./Card";

export default {
    component: Card,
    title: "Card",
} as ComponentMeta<typeof Card>;

const Template: ComponentStory<typeof Card> = (args) => <Card {...args} />;

export const Default = Template.bind({});
Default.args = {
    isSelectable: true,
    isSelected: false,
    isDisabled: false,
    subHeading: "9:00 - 10:00 AM (1 hr)",
    heading: "Climate Justice in the 2020s",
    editControls: (
        <ButtonGroup ml={2} spacing={0}>
            <IconButton
                aria-label="Demo Button 1"
                icon={<FAIcon iconStyle="s" icon="link" />}
                variant="ghost"
                colorScheme="purple"
                size="lg"
                p={2}
                minW={0}
                minH={0}
                w="2em"
                h="2em"
                borderRadius="100%"
                onClick={(ev) => {
                    ev.stopPropagation();
                    alert("Demo Button 1");
                }}
            />
            <IconButton
                aria-label="Demo Button 2"
                icon={<FAIcon iconStyle="s" icon="edit" />}
                variant="ghost"
                colorScheme="purple"
                size="lg"
                p={2}
                minW={0}
                minH={0}
                w="2em"
                h="2em"
                borderRadius="100%"
                onClick={(ev) => {
                    ev.stopPropagation();
                    alert("Demo Button 2");
                }}
            />
            <IconButton
                aria-label="Demo Button 3"
                icon={<FAIcon iconStyle="s" icon="ellipsis-v" />}
                variant="ghost"
                colorScheme="purple"
                size="lg"
                p={2}
                minW={0}
                minH={0}
                w="2em"
                h="2em"
                borderRadius="100%"
                onClick={(ev) => {
                    ev.stopPropagation();
                    alert("Demo Button 3");
                }}
            />
        </ButtonGroup>
    ),
    width: "500px",
};

export const WithRightButton = Template.bind({});
WithRightButton.args = {
    ...Default.args,
    rightButton: {
        label: "Expand session details",
        colorScheme: "blue",
        icon: "chevron-right",
        iconStyle: "s",
        onClick: () => {
            // Do nothing
        },
        variant: "ghost",
    },
};

export const WithBottomButton = Template.bind({});
WithBottomButton.args = {
    ...Default.args,
    bottomButton: {
        label: "Expand session details",
        colorScheme: "blue",
        icon: "chevron-down",
        iconStyle: "s",
        onClick: () => {
            // Do nothing
        },
        variant: "ghost",
    },
};

export const WithRightAndBottomButtons = Template.bind({});
WithRightAndBottomButtons.args = {
    ...Default.args,
    rightButton: WithRightButton.args!.rightButton,
    bottomButton: WithBottomButton.args!.bottomButton,
};
