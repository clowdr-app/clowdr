import { Box } from "@chakra-ui/react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { GalleryPage } from "./GalleryPage";
import { makeViewports } from "./Utils.stories";

export default {
    title: "Video Chat/Gallery/Gallery Page",
    component: GalleryPage,
    args: {
        numberViewports: 3,
    },
    argTypes: {
        numberViewports: {
            control: { type: "number", min: 0, step: 1 },
        },
    },
} as ComponentMeta<typeof GalleryPage>;

const Template: ComponentStory<
    (props: Parameters<typeof GalleryPage>[0] & { numberViewports: number }) => JSX.Element
> = (args) => {
    const [viewports, inPortals] = makeViewports(args.numberViewports);
    return (
        <Box h={`${args.maxHeight}px`} w={`${args.maxWidth}px`}>
            {inPortals}
            <GalleryPage {...args} viewports={viewports} />
        </Box>
    );
};

export const SimpleGalleryPage = Template.bind({});
SimpleGalleryPage.args = {
    maxColumns: 5,
    maxHeight: 500,
    maxWidth: 500,
    streamActivities: new Map(),
    viewports: [],
};
