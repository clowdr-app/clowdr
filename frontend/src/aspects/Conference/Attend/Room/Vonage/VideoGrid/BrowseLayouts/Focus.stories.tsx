import { Box } from "@chakra-ui/react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { Focus } from "./Focus";
import { makeViewports } from "./Utils.stories";

export default {
    title: "Video Chat/Gallery/Focus",
    component: Focus,
    args: {
        numberViewports: 3,
        numberFocusViewports: 1,
        canvasWidth: 600,
        canvasHeight: 600,
        streamActivities: new Map(),
    },
    argTypes: {
        numberViewports: {
            control: { type: "number", min: 0, step: 1 },
        },
        numberFocusViewports: {
            control: { type: "number", min: 0, step: 1 },
        },
        canvasWidth: {
            control: { type: "range", min: 0, step: 20, max: 1200 },
        },
        canvasHeight: {
            control: { type: "range", min: 0, step: 20, max: 1200 },
        },
    },
} as ComponentMeta<typeof Focus>;

const Template: ComponentStory<
    (
        props: Parameters<typeof Focus>[0] & {
            numberViewports: number;
            numberFocusViewports: number;
            canvasHeight: number;
            canvasWidth: number;
        }
    ) => JSX.Element
> = (args) => {
    const [viewports, inPortals] = makeViewports(args.numberViewports);
    const [focusViewports, focusInPortals] = makeViewports(args.numberFocusViewports);
    return (
        <Box h={`${args.canvasHeight}px`} w={`${args.canvasWidth}px`}>
            {inPortals}
            {focusInPortals}
            <Focus {...args} viewports={viewports} focusViewports={focusViewports} />
        </Box>
    );
};

export const SimpleGallery = Template.bind({});
SimpleGallery.args = {};
