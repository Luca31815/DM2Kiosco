import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isDemoMode, setIsDemoMode] = useState(false);

    useEffect(() => {
        const getCookie = (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        };

        const mode = getCookie('dashboard_mode');
        // En entorno local de desarrollo (Vite) no corre el middleware de Vercel para logins. Forzamos modo "Live" (Admin)
        if (import.meta.env.DEV) {
            setIsDemoMode(false);
        } else {
            setIsDemoMode(mode === 'demo');
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isDemoMode }}>
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
