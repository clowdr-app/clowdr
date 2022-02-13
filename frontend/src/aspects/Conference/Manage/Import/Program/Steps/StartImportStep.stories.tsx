import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import StartImportStep from "./StartImportStep";
import validatedData from "./StoryData/ValidatedData.json";

export default {
    component: StartImportStep,
    title: "Import Program/Steps/Start Import",
} as ComponentMeta<typeof StartImportStep>;

const Template: ComponentStory<typeof StartImportStep> = (args) => <StartImportStep {...args} />;

export const Default = Template.bind({});
Default.args = {
    data: validatedData as any,
};
