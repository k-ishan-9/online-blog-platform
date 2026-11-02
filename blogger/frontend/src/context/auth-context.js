import { createContext } from 'react';

// Holds { user, loading, refresh, logout }; provided by AuthProvider, read with useAuth()
export const AuthContext = createContext(null);
