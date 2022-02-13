import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import Step from "./ReviewDataStep";
import repairedData from "./StoryData/RepairedData.json";

export default {
    component: Step,
    title: "Import Program/Steps/Review data",
} as ComponentMeta<typeof Step>;

const Template: ComponentStory<typeof Step> = (args) => <Step {...args} />;

export const Default = Template.bind({});
Default.args = {
    data: repairedData as any,
    isActive: true,
    onValidatedData: (data) => {
        console.log("Validated data", data);
    },
};
