import { useAuth0 } from "@auth0/auth0-react";

export default function useUserId(): string | null {
    const { isAuthenticated, user } = useAuth0();

    if (isAuthenticated && user?.sub) {
        return user.sub;
    }
    return null;
}
