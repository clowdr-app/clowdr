import { Box } from "@chakra-ui/react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { Gallery } from "./Gallery";
import { makeViewports } from "./Utils.stories";

export default {
    title: "Gallery",
    component: Gallery,
    args: {
        numberViewports: 3,
        canvasWidth: 600,
        canvasHeight: 600,
    },
    argTypes: {
        numberViewports: {
            control: { type: "number", min: 0, step: 1 },
        },
        canvasWidth: {
            control: { type: "range", min: 0, step: 20, max: 1200 },
        },
        canvasHeight: {
            control: { type: "range", min: 0, step: 20, max: 1200 },
        },
    },
} as ComponentMeta<typeof Gallery>;

const Template: ComponentStory<
    (
        props: Parameters<typeof Gallery>[0] & { numberViewports: number; canvasHeight: number; canvasWidth: number }
    ) => JSX.Element
> = (args) => {
    const [viewports, inPortals] = makeViewports(args.numberViewports);
    return (
        <Box h={`${args.canvasHeight}px`} w={`${args.canvasWidth}px`}>
            {inPortals}
            <Gallery {...args} viewports={viewports} />
        </Box>
    );
};

export const Basic = Template.bind({});
Basic.args = {
    streamActivities: new Map(),
};
