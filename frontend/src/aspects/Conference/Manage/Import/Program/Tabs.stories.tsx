import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import Tabs from "./Tabs";

export default {
    component: Tabs,
    title: "Import Program/Steps",
} as ComponentMeta<typeof Tabs>;

const Template: ComponentStory<typeof Tabs> = (args) => <Tabs {...args} />;

export const Default = Template.bind({});
Default.args = {
    onStartImport: async (data, options) => {
        console.log("Start import", { data, options });
    },
};
