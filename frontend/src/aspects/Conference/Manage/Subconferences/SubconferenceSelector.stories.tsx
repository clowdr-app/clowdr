import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { Provider } from "urql";
import { never } from "wonka";
import { ConferenceProvider_WithUser } from "../../useConference";
import { SubconferenceSelector } from "./SubconferenceSelector";

const fetchingState = {
    executeQuery: () => never,
};

export default {
    component: SubconferenceSelector,
    title: "SubconferenceSelector",
} as ComponentMeta<typeof SubconferenceSelector>;

const Template: ComponentStory<typeof SubconferenceSelector> = (args) => (
    <ConferenceProvider_WithUser
        userId="00000000-0000-0000-0000-000000000000"
        conferenceId="00000000-0000-0000-0000-000000000000"
    >
        {(error?: JSX.Element) =>
            error ? (
                error
            ) : (
                <Provider value={fetchingState as any}>
                    <SubconferenceSelector {...args} />
                </Provider>
            )
        }
    </ConferenceProvider_WithUser>
);

export const Default = Template.bind({});
Default.args = {};
