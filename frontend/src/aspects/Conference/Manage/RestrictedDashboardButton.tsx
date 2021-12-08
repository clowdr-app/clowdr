import type { ButtonProps } from "@chakra-ui/react";
import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../Chakra/FAIcon";
import { LinkButton } from "../../Chakra/LinkButton";
import { useAuthParameters } from "../../GQL/AuthParameters";
import RequireRole from "../RequireRole";

export default function RestrictedDashboardButton({
    to,
    name,
    icon,
    iconStyle,
    description,
    organizerRole,
    moderatorRole,
    attendeeRole,
    colorScheme,
    ...rest
}: ButtonProps & {
    to: string;
    name: string;
    icon: string;
    iconStyle?: "b" | "s" | "r";
    description: string;
    organizerRole?: boolean;
    moderatorRole?: boolean;
    attendeeRole?: boolean;
    colorScheme?: string;
}): JSX.Element | null {
    const { conferencePath } = useAuthParameters();

    return (
        <RequireRole organizerRole={organizerRole} moderatorRole={moderatorRole} attendeeRole={attendeeRole}>
            <LinkButton
                to={`${conferencePath}/manage/${to}`}
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
        </RequireRole>
    );
}
