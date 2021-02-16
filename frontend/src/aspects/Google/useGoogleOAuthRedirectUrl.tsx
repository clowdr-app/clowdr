import { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useRestorableState } from "../Generic/useRestorableState";

export function useGoogleOAuthRedirectPath(): [
    url: string | null,
    setUrl: (url: string | null) => void,
    follow: () => void
] {
    const [url, setUrl] = useRestorableState<string | null>(
        "clowdr-googleOAuthRedirectPath",
        null,
        (x) => JSON.stringify(x),
        (x) => JSON.parse(x)
    );

    const [followUrl, setFollowUrl] = useState<string | null>(null);

    const history = useHistory();
    useEffect(() => {
        if (!url && followUrl) {
            history.push(followUrl);
        }
    }, [url, followUrl, history]);

    const follow = useCallback(() => {
        setFollowUrl(url);
        setUrl(null);
    }, [setUrl, url]);

    return [url, setUrl, follow];
}
