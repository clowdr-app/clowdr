import type { CenterProps, SpinnerProps } from "@chakra-ui/react";
import { Center, Spinner } from "@chakra-ui/react";
import React from "react";

export default function CenteredSpinner({
    spinnerProps,
    centerProps,
    caller,
}: {
    spinnerProps?: SpinnerProps;
    centerProps?: CenterProps;
    caller: string;
}): JSX.Element {
    return (
        <Center w="100%" h="100%" {...centerProps}>
            <div>
                <Spinner {...spinnerProps} />
                {caller}
            </div>
        </Center>
    );
}
