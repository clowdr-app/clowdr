import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import Step from "./SelectFileStep";

export default {
    component: Step,
    title: "Import Program/Steps/Select File",
} as ComponentMeta<typeof Step>;

const Template: ComponentStory<typeof Step> = (args) => <Step {...args} />;

export const Default = Template.bind({});
Default.args = {
    onData: (data) => {
        console.log("Data", data);
    },
};
