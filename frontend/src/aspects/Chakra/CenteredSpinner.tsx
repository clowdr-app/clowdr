import { Center, CenterProps, Spinner, SpinnerProps } from "@chakra-ui/react";
import React from "react";

export default function CenteredSpinner({
    spinnerProps,
    centerProps,
}: {
    spinnerProps?: SpinnerProps;
    centerProps?: CenterProps;
}): JSX.Element {
    return (
        <Center w="100%" h="100%" {...centerProps}>
            <div>
                <Spinner {...spinnerProps} />
            </div>
        </Center>
    );
}
