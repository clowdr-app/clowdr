import { Box } from "@chakra-ui/react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { Gallery } from "./Gallery";
import { makeViewports } from "./GalleryPage.stories";

export default {
    title: "Gallery",
    component: Gallery,
    argTypes: {
        numberViewports: {
            control: { type: "number", min: 0, step: 1 },
            defaultValue: 1,
        },
    },
} as ComponentMeta<typeof Gallery>;

const Template: ComponentStory<(props: Parameters<typeof Gallery>[0] & { numberViewports: number }) => JSX.Element> = (
    args
) => {
    const [viewports, inPortals] = makeViewports(args.numberViewports);
    return (
        <Box h="600px">
            {inPortals}
            <Gallery {...args} viewports={viewports} />
        </Box>
    );
};

export const Basic = Template.bind({});
Basic.args = {
    streamActivities: new Map(),
};
