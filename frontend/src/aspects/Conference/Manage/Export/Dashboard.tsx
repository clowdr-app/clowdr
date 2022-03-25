import { Flex } from "@chakra-ui/react";
import React from "react";
import { DashboardPage } from "../DashboardPage";
import RestrictedDashboardButton from "../RestrictedDashboardButton";

export function Dashboard(): JSX.Element {
    return (
        <DashboardPage title="Export">
            <Flex
                flexDirection="row"
                flexWrap="wrap"
                gridGap={["0.3rem", "0.3rem", "1rem"]}
                alignItems="stretch"
                justifyContent="left"
                maxW={1100}
            >
                <RestrictedDashboardButton
                    to="export/youtube"
                    name="Upload to YouTube"
                    icon="youtube"
                    iconStyle="b"
                    description="Export videos to YouTube."
                    organizerRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="export/download-videos"
                    name="Download videos"
                    icon="download"
                    description="Export videos to your computer."
                    organizerRole
                    colorScheme="purple"
                />
            </Flex>
        </DashboardPage>
    );
}
