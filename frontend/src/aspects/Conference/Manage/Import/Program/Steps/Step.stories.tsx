import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import Step from "./Step";

export default {
    component: Step,
    title: "Import Program/Step",
} as ComponentMeta<typeof Step>;

const Template: ComponentStory<typeof Step> = (args) => <Step {...args} />;

export const Default = Template.bind({});
Default.args = {};
