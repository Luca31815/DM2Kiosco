/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Modo demo activo automáticamente cuando no existe sesión autenticada
    const isDemoMode = !session;

    const openLoginModal = React.useCallback(() => setIsLoginModalOpen(true), []);
    const closeLoginModal = React.useCallback(() => setIsLoginModalOpen(false), []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch((err) => {
            console.error('Error obteniendo sesión de Supabase:', err);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            if (session) {
                setIsLoginModalOpen(false);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signInWithPassword = async (email, password) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            setIsLoginModalOpen(false);
            return data;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } finally {
            setLoading(false);
        }
    };

    const contextValue = React.useMemo(
        () => ({
            session,
            user,
            loading,
            isDemoMode,
            isLoginModalOpen,
            openLoginModal,
            closeLoginModal,
            signInWithPassword,
            signOut
        }),
        [session, user, loading, isDemoMode, isLoginModalOpen, openLoginModal, closeLoginModal]
    );

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

