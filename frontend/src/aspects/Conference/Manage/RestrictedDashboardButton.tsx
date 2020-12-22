import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import type { Permission_Enum } from "../../../generated/graphql";
import LinkButton from "../../Chakra/LinkButton";
import FAIcon from "../../Icons/FAIcon";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";

export default function RestrictedDashboardButton({
    to,
    name,
    icon,
    description,
    permissions,
    colorScheme,
}: {
    to: string;
    name: string;
    icon: string;
    description: string;
    permissions?: Permission_Enum[];
    colorScheme?: string;
}): JSX.Element | null {
    const conference = useConference();

    return (
        <RequireAtLeastOnePermissionWrapper permissions={permissions}>
            <LinkButton
                to={`/conference/${conference.slug}/manage/${to}`}
                padding={5}
                overflow="hidden"
                whiteSpace="normal"
                linkProps={{
                    maxWidth: "20%",
                    minWidth: "300px",
                }}
                colorScheme={colorScheme ?? "blue"}
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                display="inline-flex"
                width="100%"
                height="100%"
                margin={0}
            >
                <Heading as="h2" fontSize="1.5rem" marginBottom="0.5rem">
                    <FAIcon iconStyle="s" icon={icon} />
                    <br />
                    {name}
                </Heading>
                <Text>{description}</Text>
            </LinkButton>
        </RequireAtLeastOnePermissionWrapper>
    );
}
