import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context';
import { getCurrentUser, logout as apiLogout } from '../services/api';

// One place that knows who is logged in. Every page reads it through useAuth(),
// so the navbar, protected routes and pages never disagree about the session.
export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Asks the server who we are (the JWT cookie is httpOnly, so JavaScript can't read it)
    const refresh = useCallback(async () => {
        const current = await getCurrentUser();
        setUser(current);
        setLoading(false);
        return current;
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading, refresh, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
