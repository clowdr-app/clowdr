import {
    Button,
    ButtonProps,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
} from "@chakra-ui/react";
import React from "react";
import { FAIcon } from "../../../../Icons/FAIcon";
import { TemplateInstructions } from "./TemplateInstructions";

export function TemplateHelpPopover(props: ButtonProps): JSX.Element {
    return (
        <Popover>
            <PopoverTrigger>
                <Button size="xs" {...props} leftIcon={<FAIcon icon="question-circle" iconStyle="s" />}>
                    Help
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader>Title and description templates</PopoverHeader>
                <PopoverBody>
                    <TemplateInstructions />
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
}
