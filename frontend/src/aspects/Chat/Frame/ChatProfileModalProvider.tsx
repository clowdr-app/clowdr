import { useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import ProfileModal from "../../Conference/Attend/Attendee/ProfileModal";
import type { Attendee } from "../../Conference/useCurrentAttendee";

interface ChatProfileModalCtx {
    open: (attendee: Attendee) => void;
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
    const [attendee, setAttendee] = useState<Attendee | null>(null);

    const open = useCallback(
        (attendee: Attendee) => {
            onOpen();
            setAttendee(attendee);
        },
        [onOpen]
    );
    const ctx = useMemo(
        () => ({
            open,
            close: () => {
                onClose();
                setAttendee(null);
            },
        }),
        [onClose, open]
    );

    return (
        <ChatProfileModalContext.Provider value={ctx}>
            {children}
            <ProfileModal attendee={attendee} isOpen={isOpen} onClose={onClose} />
        </ChatProfileModalContext.Provider>
    );
}
