import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { SubconferenceSelector } from "./SubconferenceSelector";

export default {
    component: SubconferenceSelector,
    title: "Card",
} as ComponentMeta<typeof SubconferenceSelector>;

const Template: ComponentStory<typeof SubconferenceSelector> = (args) => <SubconferenceSelector {...args} />;

export const Default = Template.bind({});
Default.args = {};
