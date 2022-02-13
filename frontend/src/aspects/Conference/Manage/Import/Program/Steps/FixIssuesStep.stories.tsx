import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import Step from "./FixIssuesStep";
import rawRecords from "./StoryData/RawRecords.json";

export default {
    component: Step,
    title: "Import Program/Steps/Fix Issues",
} as ComponentMeta<typeof Step>;

const Template: ComponentStory<typeof Step> = (args) => <Step {...args} />;

export const Default = Template.bind({});
Default.args = {
    data: rawRecords as any,
    onRepairedData: (data) => {
        console.log("Repaired data", data);
    },
};
