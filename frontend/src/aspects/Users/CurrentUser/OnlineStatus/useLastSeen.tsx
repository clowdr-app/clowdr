import { createContext, useContext } from "react";

export const LastSeenContext = createContext<Date | undefined>(undefined);

export default function useLastSeen(): Date | undefined {
    const lastSeen = useContext(LastSeenContext);
    return lastSeen;
}
