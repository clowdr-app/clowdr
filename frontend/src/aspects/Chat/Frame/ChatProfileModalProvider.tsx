import { useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import ProfileModal from "../../Conference/Attend/Registrant/ProfileModal";
import type { Registrant } from "../../Conference/useCurrentRegistrant";

interface ChatProfileModalCtx {
    open: (registrant: Registrant) => void;
    close: () => void;
}

const ChatProfileModalContext = React.createContext<ChatProfileModalCtx | undefined>(undefined);

export function useChatProfileModal(): ChatProfileModalCtx {
    const ctx = React.useContext(ChatProfileModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function ChatProfileModalProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [registrant, setRegistrant] = useState<Registrant | null>(null);

    const open = useCallback(
        (registrant: Registrant) => {
            onOpen();
            setRegistrant(registrant);
        },
        [onOpen]
    );
    const ctx = useMemo(
        () => ({
            open,
            close: () => {
                onClose();
                setRegistrant(null);
            },
        }),
        [onClose, open]
    );

    return (
        <ChatProfileModalContext.Provider value={ctx}>
            {children}
            <ProfileModal registrant={registrant} isOpen={isOpen} onClose={onClose} />
        </ChatProfileModalContext.Provider>
    );
}
