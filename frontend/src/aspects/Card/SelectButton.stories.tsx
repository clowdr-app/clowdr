/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import SelectButton from "./SelectButton";

export default {
    component: SelectButton,
    title: "Card/Select Button",
} as ComponentMeta<typeof SelectButton>;

const Template: ComponentStory<typeof SelectButton> = (args) => {
    return <SelectButton {...args} />;
};

export const Default = Template.bind({});
Default.args = {
    isSelected: false,
    isDisabled: false,
};

export const NotSelected = Template.bind({});
NotSelected.args = {
    isSelected: false,
    isDisabled: false,
};

export const Selected = Template.bind({});
Selected.args = {
    isSelected: true,
    isDisabled: false,
};

export const NotSelected_Disabled = Template.bind({});
NotSelected_Disabled.args = {
    isSelected: false,
    isDisabled: true,
};

export const Selected_Disabled = Template.bind({});
Selected_Disabled.args = {
    isSelected: true,
    isDisabled: true,
};
