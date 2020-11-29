import {
    useNoPrimaryMenuButtons,
    usePrimaryMenuButton,
} from "../../Menu/usePrimaryMenuButtons";
import { useConference } from "../ConferenceProvider";

export default function useDashboardPrimaryMenuButtons(): void {
    const conference = useConference();
    useNoPrimaryMenuButtons();
    usePrimaryMenuButton({
        key: `back-to-conference-dashboard-${conference.slug}`,
        action: `/conference/${conference.slug}/manage`,
        label: "Back to conference dashboard",
        text: "Back to dashboard",
    });
}
