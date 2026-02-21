import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    async function fetchProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, full_name, email')
                .eq('id', userId)
                .single();

            if (data && !error) {
                setUserRole(data.role);
                return data;
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
        setUserRole('customer');
        return null;
    }

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            console.log("Starting Auth Initialization...");

            // Set a safety timeout - if auth check takes > 5s, 
            // force loading to false to show the UI
            const timeout = setTimeout(() => {
                if (mounted && loading) {
                    console.warn("Auth initialization timed out - forcing loading to false");
                    setLoading(false);
                }
            }, 5000);

            try {
                // Get initial session
                console.log("Fetching Supabase session...");
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (mounted) {
                    if (session?.user) {
                        console.log("Session found for:", session.user.email);
                        setCurrentUser(session.user);
                        fetchProfile(session.user.id);
                    } else {
                        console.log("No active session found.");
                    }
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
            } finally {
                clearTimeout(timeout);
                if (mounted) {
                    console.log("Auth Initialization complete.");
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth State Change:", event, session?.user?.email);
            if (mounted) {
                if (session?.user) {
                    setCurrentUser(session.user);
                    // Only fetch profile if we don't have it or user changed
                    await fetchProfile(session.user.id);
                } else {
                    setCurrentUser(null);
                    setUserRole(null);
                }
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const sendLoginSuccessEmail = (name, email) => {
        // Placeholder for EmailJS integration
        // This function will be called on successful login/signup
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_LOGIN;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
            emailjs.send(serviceId, templateId, {
                to_name: name || 'User',
                to_email: email,
                message: 'You have successfully logged in to Santi Rice Mill.'
            }, publicKey)
                .then(() => {
                    console.log('Login email sent successfully!');
                }, (error) => {
                    console.error('Failed to send login email:', error);
                });
        } else {
            console.log("EmailJS keys missing or incomplete - Skipping email send");
        }
    };

    const signup = async (email, password, name) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });
        if (error) throw error;
        // User profile creation is handled by Supabase Trigger
        if (data.user) {
            // Optionally send welcome email here too
            sendLoginSuccessEmail(name, email);
        }
        return data;
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Fetch profile to get name for email
        if (data.user) {
            const profile = await fetchProfile(data.user.id);
            sendLoginSuccessEmail(profile?.full_name || email.split('@')[0], email);
        }
        return data;
    };

    async function logout() {
        console.log("Logout initiated...");
        try {
            // Clear local state IMMEDIATELY for snappy UI response
            setCurrentUser(null);
            setUserRole(null);

            // Then perform the background cleanup
            const { error } = await supabase.auth.signOut();
            if (error) console.error("Supabase signOut error:", error);
        } catch (error) {
            console.error('Error during logout execution:', error);
        } finally {
            console.log("Logout cleanup complete.");
            // Ensure state is definitely cleared
            setCurrentUser(null);
            setUserRole(null);
        }
    }

    const resetPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    };

    const updatePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    };

    const value = {
        currentUser,
        userRole,
        loading, // Expose loading state
        signup,
        login,
        logout,
        resetPassword,
        updatePassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
