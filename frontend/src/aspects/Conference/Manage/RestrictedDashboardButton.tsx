import { ButtonProps, Heading, Text } from "@chakra-ui/react";
import React from "react";
import type { Permissions_Permission_Enum } from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import FAIcon from "../../Icons/FAIcon";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";

export default function RestrictedDashboardButton({
    to,
    name,
    icon,
    iconStyle,
    description,
    permissions,
    colorScheme,
    ...rest
}: ButtonProps & {
    to: string;
    name: string;
    icon: string;
    iconStyle?: "b" | "s" | "r";
    description: string;
    permissions?: Permissions_Permission_Enum[];
    colorScheme?: string;
}): JSX.Element | null {
    const conference = useConference();

    return (
        <RequireAtLeastOnePermissionWrapper permissions={permissions}>
            <LinkButton
                to={`/conference/${conference.slug}/manage/${to}`}
                padding={4}
                overflow="hidden"
                whiteSpace="normal"
                linkProps={{
                    maxWidth: "20%",
                    minWidth: "300px",
                }}
                colorScheme={colorScheme ?? "blue"}
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="center"
                display="inline-flex"
                width="100%"
                height="100%"
                margin={0}
                {...rest}
            >
                <Heading as="h2" fontSize="2xl" marginBottom="0.5rem">
                    <FAIcon iconStyle={iconStyle ?? "s"} icon={icon} />
                    <br />
                    {name}
                </Heading>
                <Text fontSize="sm">{description}</Text>
            </LinkButton>
        </RequireAtLeastOnePermissionWrapper>
    );
}
