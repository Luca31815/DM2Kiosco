import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isDemoMode, setIsDemoMode] = useState(false);

    useEffect(() => {
        // Función simple para leer cookies
        const getCookie = (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        };

        const mode = getCookie('dashboard_mode');
        // Si no hay cookie (ej: desarrollo local sin middleware), asumimos live para el dueño
        // Pero el middleware en Vercel se encargará de setearla.
        setIsDemoMode(mode === 'demo');
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
