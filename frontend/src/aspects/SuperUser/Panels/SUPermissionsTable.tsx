import {
    Code,
    Container,
    Divider,
    Heading,
    Link,
    List,
    ListItem,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    VStack,
} from "@chakra-ui/react";
import React from "react";

export default function SUPermissionsTable(): JSX.Element {
    return (
        <VStack spacing={4} alignItems="flex-start">
            <Heading pt={4} as="h3" fontSize="lg">
                Introduction
            </Heading>
            <Container ml={0}>
                <Text>
                    These tables describe every possible superuser permission grant. For each possibility, a role name
                    is given. Roles are not formalised within Midspace but are suggested as a helpful way to configure
                    the system according to our recommendations.
                </Text>
            </Container>
            <Heading pt={4} as="h3" fontSize="lg">
                Recommended Roles
            </Heading>
            <Container ml={0}>
                <Text>
                    These roles are recommended combinations of permissions. They have no technical or formal meaning
                    within the system and are provided primarily as a convenient way to talk about and configure the
                    recommended superuser accounts.
                </Text>
                <Text mt={2}>
                    The roles are based on the principle of reducing the amount of damage a malicious user of a breached
                    account could cause, while making more frequently used actions available to the least-privileged
                    accounts. A more powerful role should not have every lesser permission - even though a Grand Super
                    User could grant themselves any permission, having to do so would (at least briefly) slow down an
                    malicious user.
                </Text>
                <Divider mt={4} />
                <List mt={4} spacing={4}>
                    <ListItem>
                        <Heading as="h4" fontSize="sm" textAlign="left" mb={1}>
                            Grand Superuser
                        </Heading>
                        <Text>
                            Capable of granting any user any permission, this is the most powerful role within the
                            system. Very few users should have access to such an account and it should not be logged
                            into / used on a regular basis (i.e. don&apos;t use such an account for routine work such as
                            creating conference codes).
                        </Text>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <Heading as="h4" fontSize="sm" textAlign="left" mb={1}>
                            Superuser
                        </Heading>
                        <Text>
                            Capable of granting any user a limited set of permissions, the Superuser role is primarily
                            for managing the accounts that will be used for day to day operations. It is intended for
                            the routine management of users with superuser privileges, which should require relatively
                            infrequent access.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Heading as="h4" fontSize="sm" textAlign="left" mb={1}>
                            Overseer
                        </Heading>
                        <Text>
                            Capable of observing and removing permissions, the Overseer role should be used for routine
                            checking / safeguarding of the system and as a primary route to recovering control in the
                            event of a malicious user assuming control of an account with superuser permissions.
                        </Text>
                    </ListItem>
                    <Divider />
                    <ListItem>
                        <Heading as="h4" fontSize="sm" textAlign="left" mb={1}>
                            System Admin
                        </Heading>
                        <Text>
                            Capable of configuring the technical settings of the system. The System Admin role is
                            intended for DevOps personnel to maintain the operational status of the platform.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Heading as="h4" fontSize="sm" textAlign="left" mb={1}>
                            Operations
                        </Heading>
                        <Text>
                            Capable of creating and managing conference codes. The Operations role is intended for sales
                            / bizdev staff to manage client&apos;s access to the platform.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Heading as="h4" fontSize="sm" textAlign="left" mb={1}>
                            Legal
                        </Heading>
                        <Text>
                            Capable of setting the legal notices required to operate the platform in a production
                            environment. The Legal role is intended for executive and legal staff who manage the company
                            name, terms and conditions, privacy policy, etc.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Heading as="h4" fontSize="sm" textAlign="left" mb={1}>
                            Communications
                        </Heading>
                        <Text>
                            Capable of setting the email addresses, enail templates and similar configuration for
                            sending (primarily email) communications from the platform to clients and attendees. The
                            Communications role is intended for a communications manager or support manager to configure
                            the communications aspects of the system.
                        </Text>
                    </ListItem>
                    <ListItem>
                        <Heading as="h4" fontSize="sm" textAlign="left" mb={1}>
                            Support
                        </Heading>
                        <Text>
                            Capable of managing users and their links to registrants. The Support role is intended for
                            support staff to manage users and their links to registrants to sort out issues such as
                            forgotten email addresses.
                        </Text>
                    </ListItem>
                </List>
            </Container>
            <Heading pt={4} as="h3" fontSize="lg">
                Superuser Permission Grants
            </Heading>
            <Table variant="striped" colorScheme="purple">
                <Thead>
                    <Tr>
                        <Th>Granted Permission</Th>
                        <Th>Target Permission</Th>
                        <Th>Role</Th>
                        <Th>Description</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    <Tr borderTopWidth="4px" borderTopStyle="double" borderTopColor="blue.500">
                        <Td>
                            <Code>VIEW_SU_PERMISSION_GRANT</Code>
                        </Td>
                        <Td>For any given target permission</Td>
                        <Td>Grand Superuser / Superuser / Overseer</Td>
                        <Td>Grants the ability to see who has been granted the specified target permission.</Td>
                    </Tr>

                    <Tr borderTopWidth="4px" borderTopStyle="double" borderTopColor="blue.500">
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>VIEW_SU_PERMISSION_GRANT</Code>
                        </Td>
                        <Td>Superuser / Overseer</Td>
                        <Td>
                            Grants the ability to grant others the <Code>VIEW_SU_PERMISSION_GRANT</Code> permission for
                            any target permission.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>Grand Superuser</Td>
                        <Td>
                            Grants the ability to grant others any superuser permission. This is the most powerful
                            permission grant - it gives the user the power to give themselves and anybody else total
                            control of the system.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>Grand Superuser / Overseer</Td>
                        <Td>
                            Grants the ability to grant others the ability to delete any permission from any other super
                            user. This is less powerful than its sibling insert permission and enables an Overseer to
                            remove another user&apos;s control (and thus limit damaging actions).
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>VIEW_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>Superuser / Overseer</Td>
                        <Td>Grants the ability to grant others access to view system configuration records.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to grant others the ability to set system configuration records.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>LIST_CONFERENCE_DEMO_CODES</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>
                            Grants the ability to grant others the ability to view a list of conference codes and their
                            statuses.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>CREATE_CONFERENCE_DEMO_CODE</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to grant others the ability to create conference codes.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>VIEW_USERS</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to grant others the ability to TODO.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>DELETE_USERS</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to grant others the ability to TODO.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>EDIT_USER_REGISTRANTS</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to grant others the ability to TODO.</Td>
                    </Tr>

                    <Tr borderTopWidth="4px" borderTopStyle="double" borderTopColor="blue.500">
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>VIEW_SU_PERMISSION_GRANT</Code>
                        </Td>
                        <Td>Superuser / Overseer</Td>
                        <Td>
                            Grants the ability to remove another user&apos;s access to the list of granted superuser
                            permissions.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>INSERT_SU_PERMISSION</Code>
                        </Td>
                        <Td>Grand Superuser / Overseer</Td>
                        <Td>Grants the ability to remove a user&apos;s ability to grant superuser permissions.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>Grand Superuser</Td>
                        <Td>
                            Grants the ability to remove another user&apos;s ability to remove superuser permissions.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>VIEW_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>Superuser / Overseer</Td>
                        <Td>
                            Grants the ability to remove another user&apos;s ability to view system configuration
                            records.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>
                            Grants the ability to remove another user&apos;s ability to set system configuration
                            records.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>LIST_CONFERENCE_DEMO_CODES</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>
                            Grants the ability to remove another user&apos;s ability to view the list of conference demo
                            codes.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>CREATE_CONFERENCE_DEMO_CODE</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to remove another user&apos;s ability to create conference codes.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>VIEW_USERS</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to grant others the ability to TODO.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>DELETE_USERS</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to grant others the ability to TODO.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_SU_PERMISSION</Code>
                        </Td>
                        <Td>
                            <Code>EDIT_USER_REGISTRANTS</Code>
                        </Td>
                        <Td>Superuser</Td>
                        <Td>Grants the ability to grant others the ability to TODO.</Td>
                    </Tr>

                    <Tr borderTopWidth="4px" borderTopStyle="double" borderTopColor="blue.500">
                        <Td>
                            <Code>LIST_CONFERENCE_DEMO_CODES</Code>
                        </Td>
                        <Td>
                            <Code>NULL</Code>
                        </Td>
                        <Td>Operations</Td>
                        <Td>
                            Grants the ability to view a list of conference codes and their statuses. This may also be
                            useful for a customer support role to see whether a client has started their onboarding or
                            not.
                        </Td>
                    </Tr>

                    <Tr borderTopWidth="4px" borderTopStyle="double" borderTopColor="blue.500">
                        <Td>
                            <Code>CREATE_CONFERENCE_DEMO_CODE</Code>
                        </Td>
                        <Td>
                            <Code>NULL</Code>
                        </Td>
                        <Td>Operations</Td>
                        <Td>Grants the ability to create conference codes.</Td>
                    </Tr>

                    <Tr borderTopWidth="4px" borderTopStyle="double" borderTopColor="blue.500">
                        <Td>
                            <Code>VIEW_USERS</Code>
                        </Td>
                        <Td>
                            <Code>NULL</Code>
                        </Td>
                        <Td>Support</Td>
                        <Td>Grants the ability to view the list of users.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>DELETE_USERS</Code>
                        </Td>
                        <Td>
                            <Code>NULL</Code>
                        </Td>
                        <Td>Support</Td>
                        <Td>Grants the ability to delete users.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>EDIT_USER_REGISTRANTS</Code>
                        </Td>
                        <Td>
                            <Code>NULL</Code>
                        </Td>
                        <Td>Support</Td>
                        <Td>Grants the ability to see the registrants linked to users and manage those links.</Td>
                    </Tr>
                </Tbody>
            </Table>
            <Heading pt={4} as="h3" fontSize="lg">
                System Configuration Permission Grants
            </Heading>
            <Table variant="striped" colorScheme="purple">
                <Thead>
                    <Tr>
                        <Th>Granted Permission</Th>
                        <Th>Target Configuration Key</Th>
                        <Th>Role</Th>
                        <Th>Description</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    <Tr borderTopWidth="4px" borderTopStyle="double" borderTopColor="blue.500">
                        <Td>
                            <Code>VIEW_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>For any given system configuration key</Td>
                        <Td>System Admin / Overseer</Td>
                        <Td>Grants the ability to view a system configuration records matching the given key.</Td>
                    </Tr>

                    <Tr borderTopWidth="4px" borderTopStyle="double" borderTopColor="blue.500">
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>HOST_ORGANISATION_NAME</Code>
                        </Td>
                        <Td>Legal</Td>
                        <Td>
                            Grants the ability to set the host organisation name, which is the full legal name of the
                            business that owns and operates the platform. The corresponding{" "}
                            <Code>VIEW_SYSTEM_CONFIGURATION</Code> targeting this configuration key should also be
                            granted.
                        </Td>
                    </Tr>

                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>TERMS_LATEST_REVISION_TIMESTAMP</Code>
                        </Td>
                        <Td>Legal</Td>
                        <Td>
                            Grants the ability to set the timestamp of the latest review of the T&amp;Cs. This is a
                            number representing the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.
                            It can be obtained by{" "}
                            <Link
                                isExternal
                                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now"
                            >
                                running <Code>Date.now()</Code> in a browser
                            </Link>
                            . The corresponding <Code>VIEW_SYSTEM_CONFIGURATION</Code> targeting this configuration key
                            should also be granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>TERMS_URL</Code>
                        </Td>
                        <Td>Legal</Td>
                        <Td>
                            Grants the ability to set the url to the terms and conditions contract. This is a string
                            representing the full URL to the relevant web page. The corresponding{" "}
                            <Code>VIEW_SYSTEM_CONFIGURATION</Code> targeting this configuration key should also be
                            granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>PRIVACY_POLICY_LATEST_REVISION_TIMESTAMP</Code>
                        </Td>
                        <Td>Legal</Td>
                        <Td>
                            Grants the ability to set the timestamp of the latest review of the privacy policy. This is
                            a number representing the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.
                            It can be obtained by{" "}
                            <Link
                                isExternal
                                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now"
                            >
                                running <Code>Date.now()</Code> in a browser
                            </Link>
                            . The corresponding <Code>VIEW_SYSTEM_CONFIGURATION</Code> targeting this configuration key
                            should also be granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>PRIVACY_POLICY_URL</Code>
                        </Td>
                        <Td>Legal</Td>
                        <Td>
                            Grants the ability to set the url to the privacy policy. This is a string representing the
                            full URL to the relevant web page. The corresponding <Code>VIEW_SYSTEM_CONFIGURATION</Code>{" "}
                            targeting this configuration key should also be granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>COOKIE_POLICY_LATEST_REVISION_TIMESTAMP</Code>
                        </Td>
                        <Td>Legal</Td>
                        <Td>
                            Grants the ability to set the timestamp of the latest review of the cookie policy. This is a
                            number representing the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.
                            It can be obtained by{" "}
                            <Link
                                isExternal
                                href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now"
                            >
                                running <Code>Date.now()</Code> in a browser
                            </Link>
                            . The corresponding <Code>VIEW_SYSTEM_CONFIGURATION</Code> targeting this configuration key
                            should also be granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>COOKIE_POLICY_URL</Code>
                        </Td>
                        <Td>Legal</Td>
                        <Td>
                            Grants the ability to set the url to the cookie policy. This is a string representing the
                            full URL to the relevant web page. The corresponding <Code>VIEW_SYSTEM_CONFIGURATION</Code>{" "}
                            targeting this configuration key should also be granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>VAPID_PUBLIC_KEY</Code>
                        </Td>
                        <Td>None</Td>
                        <Td>
                            Grants the ability to set the VAPID Public Key for push notifications. VAPID keys are used
                            for push notifications and are generated automatically by the realtime service on first use.
                            As such, this shouldn&apos;t need to be set manually except when clearing the keys to change
                            them over, which is rarely if ever needed.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>VAPID_PRIVATE_KEY</Code>
                        </Td>
                        <Td>None</Td>
                        <Td>
                            Grants the ability to set the VAPID Private Key for push notifications. VAPID keys are used
                            for push notifications and are generated automatically by the realtime service on first use.
                            As such, this shouldn&apos;t need to be set manually except when clearing the keys to change
                            them over, which is rarely if ever needed.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>DEFAULT_VIDEO_ROOM_BACKEND</Code>
                        </Td>
                        <Td>System Admin</Td>
                        <Td>
                            Grants the ability to set the default video room backend used in social rooms. This can be
                            <Code>CHIME</Code>, <Code>VONAGE</Code> or simply left unset (no record).
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>SENDGRID_API_KEY</Code>
                        </Td>
                        <Td>System Admin</Td>
                        <Td>Grants the ability to set the SendGrid API Key used for sending emails.</Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>SENDGRID_SENDER</Code>
                        </Td>
                        <Td>Communications</Td>
                        <Td>
                            Grants the ability to set the sender email address used when sending emails via SendGrid.
                            The corresponding <Code>VIEW_SYSTEM_CONFIGURATION</Code> targeting this configuration key
                            should also be granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>SENDGRID_REPLYTO</Code>
                        </Td>
                        <Td>Communications</Td>
                        <Td>
                            Grants the ability to set the reply-to email address specified in emails sent via SendGrid.
                            The corresponding <Code>VIEW_SYSTEM_CONFIGURATION</Code> targeting this configuration key
                            should also be granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>STOP_EMAILS_CONTACT_EMAIL_ADDRESS</Code>
                        </Td>
                        <Td>Communications</Td>
                        <Td>
                            Grants the ability to set the &ldquo;unsubscribe&rdquo; email address for attendees to
                            request the host organisation ceases to send them emails. The corresponding{" "}
                            <Code>VIEW_SYSTEM_CONFIGURATION</Code> targeting this configuration key should also be
                            granted.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>DEFAULT_FRONTEND_HOST</Code>
                        </Td>
                        <Td>System Admin</Td>
                        <Td>
                            Grants the ability to set the default frontend host, including both the protocol and the
                            domain. For example, <Code>https://in.midspace.app</Code>.
                        </Td>
                    </Tr>
                    <Tr>
                        <Td>
                            <Code>SET_SYSTEM_CONFIGURATION</Code>
                        </Td>
                        <Td>
                            <Code>ALLOW_EMAILS_TO_DOMAINS</Code>
                        </Td>
                        <Td>System Admin</Td>
                        <Td>
                            Grants the ability to set the list of email address patterns the system is allowed to send
                            emails to. In production environments, this should be <Code>[&ldquo;*&rdquo;]</Code> to
                            allow emails to anyone. In development environments, we recommend restricting the list to
                            <Code>[&ldquo;your-email@someone.org&rdquo;]</Code>
                        </Td>
                    </Tr>
                </Tbody>
            </Table>
        </VStack>
    );
}
