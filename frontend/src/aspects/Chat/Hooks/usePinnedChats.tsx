import { useEffect, useMemo, useState } from "react";
import { useConference } from "../../Conference/useConference";
import type { ChatState } from "../ChatGlobalState";
import { useGlobalChatState } from "../GlobalChatStateProvider";

export default function usePinnedChats(): Map<string, ChatState> | null {
    const conference = useConference();
    const announcementsChatId = useMemo(
        () => ("announcementsChatId" in conference ? conference.announcementsChatId : undefined),
        [conference]
    );

    const [pinnedChatsMap, setPinnedChatsMap] = useState<Map<string, ChatState> | null>(null);
    const globalChatState = useGlobalChatState();

    useEffect(() => {
        const unsubscribeIsPinned = new Map<string, () => void>();

        const unsubscribeChatStates = globalChatState.Chats.subscribe((chatStates) => {
            if (chatStates.size > 0) {
                chatStates.forEach((chatState) => {
                    if (chatState.Id !== announcementsChatId) {
                        if (!unsubscribeIsPinned.has(chatState.Id)) {
                            unsubscribeIsPinned.set(
                                chatState.Id,
                                chatState.IsPinned.subscribe((isPinned) => {
                                    setPinnedChatsMap((oldPinnedChats) => {
                                        if (isPinned && !oldPinnedChats?.has(chatState.Id)) {
                                            const newPinnedChats = new Map(oldPinnedChats ?? []);
                                            newPinnedChats.set(chatState.Id, chatState);
                                            return newPinnedChats;
                                        } else if (!isPinned && oldPinnedChats?.has(chatState.Id)) {
                                            const newPinnedChats = new Map(oldPinnedChats ?? []);
                                            newPinnedChats.delete(chatState.Id);
                                            return newPinnedChats;
                                        }
                                        return oldPinnedChats;
                                    });
                                })
                            );
                        }
                    }
                });
            } else {
                setPinnedChatsMap(new Map());
            }
        });

        return () => {
            unsubscribeIsPinned.forEach((unsubscribe) => unsubscribe());
            unsubscribeChatStates();
        };
    }, [announcementsChatId, globalChatState]);

    return pinnedChatsMap;
}
