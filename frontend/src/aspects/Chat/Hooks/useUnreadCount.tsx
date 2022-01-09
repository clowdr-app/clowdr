import { useEffect, useRef, useState } from "react";
import type { ChatState } from "../ChatGlobalState";

export default function useUnreadCount(
    chats: Map<string, ChatState> | ChatState | null | undefined,
    onChange?: (count: string) => void
): string {
    const unreadCountsRef = useRef<Map<string, string>>(new Map());
    const [unreadCountStr, setUnreadCountStr] = useState<string>("");

    useEffect(() => {
        let unsubs: (() => void)[] = [];

        if (chats) {
            unsubs = (chats instanceof Map ? [...chats.values()] : [chats]).map((chat) => {
                return chat.UnreadCount.subscribe((count) => {
                    unreadCountsRef.current.set(chat.Id, count);

                    const total = [...unreadCountsRef.current.values()].reduce(
                        (acc, x) => {
                            if (x?.length) {
                                if (x.includes("+")) {
                                    acc.count =
                                        acc.count + 30 /* services/realtime/.../unreadCount.ts:maxUnreadMessages */;
                                    acc.more = true;
                                } else {
                                    acc.count = acc.count + parseInt(x, 10);
                                }
                            }
                            return acc;
                        },
                        { count: 0, more: false }
                    );
                    const str = total.more ? total.count + "+" : total.count > 0 ? total.count.toString() : "";
                    setUnreadCountStr(str);
                    onChange?.(str);
                });
            });
        }

        return () => {
            unsubs.forEach((unsub) => unsub());
        };
    }, [chats, onChange]);

    return unreadCountStr;
}
