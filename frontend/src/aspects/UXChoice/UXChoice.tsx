import { useBreakpointValue, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import { useRestorableState } from "../Generic/useRestorableState";

export enum UXChoice {
    V1 = "V1",
    V2 = "V2",
}

export interface UXChoiceContext {
    rawChoice: UXChoice | null;
    choice: UXChoice;
    setChoice: (val: UXChoice) => void;
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}

const context = React.createContext<UXChoiceContext>({
    rawChoice: null,
    choice: UXChoice.V1,
    setChoice: (_v) => {
        // Empty
    },
    isOpen: false,
    onOpen: () => {
        /* EMPTY */
    },
    onClose: () => {
        /* EMPTY */
    },
});

export function useUXChoice(): UXChoiceContext {
    return React.useContext(context);
}

export function UXChoiceProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const [rawChoice, setRawChoice] = useRestorableState<UXChoice | null>(
        "CLOWDR_UX_CHOICE",
        null,
        (x) => (x !== null ? x : "null"),
        (x) => (x === null ? null : (x as UXChoice))
    );
    const { isOpen, onOpen, onClose } = useDisclosure({
        defaultIsOpen: rawChoice === null,
    });

    const setChoice = useCallback((val: UXChoice) => setRawChoice(val), [setRawChoice]);

    const choice =
        useBreakpointValue({
            base: UXChoice.V1,
            sm: rawChoice ?? UXChoice.V2,
        }) ?? UXChoice.V2;

    const ctx = useMemo(
        () => ({
            rawChoice,
            choice,
            setChoice,
            isOpen,
            onOpen,
            onClose,
        }),
        [rawChoice, choice, setChoice, isOpen, onOpen, onClose]
    );

    return <context.Provider value={ctx}>{children}</context.Provider>;
}
