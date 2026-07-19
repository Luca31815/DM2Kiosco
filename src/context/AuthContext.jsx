/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isDemoMode] = useState(() => {
        if (typeof document === 'undefined') return false;
        if (import.meta.env.DEV) return false;

        const value = `; ${document.cookie}`;
        const parts = value.split(`; dashboard_mode=`);
        if (parts.length === 2) return parts.pop().split(';').shift() === 'demo';
        return false;
    });

    const contextValue = React.useMemo(() => ({ isDemoMode }), [isDemoMode]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
