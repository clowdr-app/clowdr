import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from "@chakra-ui/react";
import React from "react";
import HowSUWorks from "./Panels/HowSUWorks";
import SUPermissionGrants from "./Panels/SUPermissionGrants";
import SUPermissionsTable from "./Panels/SUPermissionsTable";
import SysConfigPermissionGrants from "./Panels/SysConfigPermissionGrants";
import SystemConfiguration from "./Panels/SystemConfiguration";

export default function SuperUserLandingPageContent(): JSX.Element {
    // TODO: Make these lazy panels

    return (
        <>
            <Accordion w="100%" allowMultiple reduceMotion>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton
                                bgColor="purple.600"
                                color="white"
                                fontWeight="bold"
                                _hover={{
                                    bgColor: "purple.400",
                                }}
                            >
                                <AccordionIcon mr={2} />
                                How do superuser permissions work?
                            </AccordionButton>
                            <AccordionPanel>{isExpanded ? <HowSUWorks /> : undefined}</AccordionPanel>
                        </>
                    )}
                </AccordionItem>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton
                                bgColor="blue.600"
                                color="white"
                                fontWeight="bold"
                                _hover={{
                                    bgColor: "blue.400",
                                }}
                            >
                                <AccordionIcon mr={2} />
                                Table of Superuser Permissions
                            </AccordionButton>
                            <AccordionPanel>{isExpanded ? <SUPermissionsTable /> : undefined}</AccordionPanel>
                        </>
                    )}
                </AccordionItem>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <AccordionIcon mr={2} />
                                Superuser Permission Grants
                            </AccordionButton>
                            <AccordionPanel>{isExpanded ? <SUPermissionGrants /> : undefined}</AccordionPanel>
                        </>
                    )}
                </AccordionItem>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <AccordionIcon mr={2} />
                                System Configuration Permission Grants
                            </AccordionButton>
                            <AccordionPanel>{isExpanded ? <SysConfigPermissionGrants /> : undefined}</AccordionPanel>
                        </>
                    )}
                </AccordionItem>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <AccordionIcon mr={2} />
                                System Configuration
                            </AccordionButton>
                            <AccordionPanel>{isExpanded ? <SystemConfiguration /> : undefined}</AccordionPanel>
                        </>
                    )}
                </AccordionItem>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <AccordionIcon mr={2} />
                                Conference Codes
                            </AccordionButton>
                            <AccordionPanel>{isExpanded ? "TODO" : undefined}</AccordionPanel>
                        </>
                    )}
                </AccordionItem>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <AccordionIcon mr={2} />
                                Users and Registrants
                            </AccordionButton>
                            <AccordionPanel>{isExpanded ? "TODO" : undefined}</AccordionPanel>
                        </>
                    )}
                </AccordionItem>
            </Accordion>
        </>
    );
}
