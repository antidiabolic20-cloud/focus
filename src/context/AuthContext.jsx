import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setStreak(0);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setProfile(data);
                checkStreak(userId);
            } else if (error && error.code === 'PGRST116') {
                // Profile doesn't exist yet (might happen on first login if trigger fails or is slow)
                console.log("Profile not found, waiting for creation...");
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    async function checkStreak(userId) {
        try {
            // Get current streak data
            const { data: streakData, error } = await supabase
                .from('streaks')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Initialize streak if missing
                await supabase.from('streaks').upsert({ user_id: userId, current_streak: 1, last_login: new Date().toISOString() });
                setStreak(1);
                return;
            }

            if (!streakData) {
                // Double check if data is null but no error
                await supabase.from('streaks').upsert({ user_id: userId, current_streak: 1, last_login: new Date().toISOString() });
                setStreak(1);
                return;
            }

            if (!streakData) return;
            setStreak(streakData.current_streak);

            const lastLogin = new Date(streakData.last_login);
            const today = new Date();

            // normalize to YYYY-MM-DD to ignore time
            const toDateString = (date) => date.toISOString().split('T')[0];

            if (toDateString(lastLogin) === toDateString(today)) {
                return; // Already logged in today
            }

            const isConsecutive = (toDateString(today) ===
                toDateString(new Date(lastLogin.setDate(lastLogin.getDate() + 1))));

            if (isConsecutive) {
                // Increment streak
                const newStreak = streakData.current_streak + 1;
                await supabase.from('streaks').update({
                    current_streak: newStreak,
                    last_login: new Date().toISOString()
                }).eq('user_id', userId);
                setStreak(newStreak);
            } else {
                // Reset streak (unless frozen - TODO: Freeze logic)
                await supabase.from('streaks').update({
                    current_streak: 1,
                    last_login: new Date().toISOString()
                }).eq('user_id', userId);
                setStreak(1);
            }
        } catch (err) {
            console.error("Error checking streak:", err);
        }
    }

    const value = {
        signUp: (data) => supabase.auth.signUp({
            ...data,
            options: {
                emailRedirectTo: window.location.origin,
            }
        }),
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signOut: () => supabase.auth.signOut(),
        refreshProfile: () => user && fetchProfile(user.id),
        user,
        profile,
        streak,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
