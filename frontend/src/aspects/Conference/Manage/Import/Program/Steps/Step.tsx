import { Button, chakra, Divider, Flex, Tooltip, VStack } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../../../../Chakra/FAIcon";

export default function Step({
    children,
    isNextStepEnabled,
    onNextStep,
    nextStepRequirement,
    isPreviousStepEnabled,
    onPreviousStep,
    previousStepRequirement,
}: React.PropsWithChildren<{
    isNextStepEnabled?: boolean;
    onNextStep?: () => void;
    nextStepRequirement?: string;

    isPreviousStepEnabled?: boolean;
    onPreviousStep?: () => void;
    previousStepRequirement?: string;
}>): JSX.Element {
    return (
        <VStack alignItems="flex-start" w="100%" spacing={4}>
            {children}
            <Divider />
            <Flex w="100%">
                {onPreviousStep ? (
                    <Tooltip label={previousStepRequirement}>
                        <chakra.div>
                            <Button
                                colorScheme="PrimaryActionButton"
                                isDisabled={!isPreviousStepEnabled}
                                onClick={onPreviousStep}
                            >
                                <FAIcon iconStyle="s" icon="chevron-left" />
                                &nbsp;<chakra.span verticalAlign="middle">Back</chakra.span>
                            </Button>
                        </chakra.div>
                    </Tooltip>
                ) : undefined}
                {onNextStep ? (
                    <Tooltip label={nextStepRequirement}>
                        <chakra.div ml="auto">
                            <Button
                                colorScheme="PrimaryActionButton"
                                isDisabled={!isNextStepEnabled}
                                onClick={onNextStep}
                            >
                                <chakra.span verticalAlign="middle">Next step</chakra.span>&nbsp;
                                <FAIcon iconStyle="s" icon="chevron-right" />
                            </Button>
                        </chakra.div>
                    </Tooltip>
                ) : undefined}
            </Flex>
        </VStack>
    );
}
