import { useEffect } from "react";
import usePrimaryMenuButtons from "../../Menu/usePrimaryMenuButtons";
import { useConference } from "../useConference";

export default function useDashboardPrimaryMenuButtons(): void {
    const conference = useConference();
    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    useEffect(() => {
        setPrimaryMenuButtons([
            {
                key: `back-to-conference-dashboard-${conference.slug}`,
                action: `/conference/${conference.slug}/manage`,
                label: "Back to conference dashboard",
                text: "Back to dashboard",
            },
        ]);
    }, [conference.slug, setPrimaryMenuButtons]);
}
