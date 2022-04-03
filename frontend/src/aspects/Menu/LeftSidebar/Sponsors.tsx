import React from "react";
import SponsorBooths from "../../Conference/Attend/Rooms/SponsorBooths";

export default function SponsorsPullout({
    setAnySponsors,
}: {
    setAnySponsors?: (value: boolean) => void;
}): JSX.Element {
    return <SponsorBooths leftAlign setAnySponsors={setAnySponsors} />;
}
