import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FocusContext = createContext();

export function FocusProvider({ children }) {
    // Persist state in localStorage so it survives refreshes
    const [isFocusMode, setIsFocusMode] = useState(() => {
        return localStorage.getItem('isFocusMode') === 'true';
    });

    const navigate = useNavigate();
    const location = useLocation();

    // Define allowed paths for Focus Mode
    // Using simple startsWith logic for flexibility (e.g. /focus matches /focus/session)
    const ALLOWED_PATHS = [
        '/',
        '/focus',
        '/resources',
        '/tests',
        '/study-buddy',
        '/profile',
        '/login',
        '/register'
    ];

    useEffect(() => {
        localStorage.setItem('isFocusMode', isFocusMode);

        if (isFocusMode) {
            checkAccess();
        }
    }, [isFocusMode, location.pathname]);

    function checkAccess() {
        const path = location.pathname;
        const isAllowed = ALLOWED_PATHS.some(allowed =>
            path === allowed || path.startsWith(`${allowed}/`)
        );

        if (!isAllowed) {
            // If on a restricted page, redirect to Dashboard or Focus Dojo
            navigate('/focus');
        }
    }

    function toggleFocusMode() {
        setIsFocusMode(prev => !prev);
    }

    return (
        <FocusContext.Provider value={{ isFocusMode, toggleFocusMode }}>
            {children}
        </FocusContext.Provider>
    );
}

export const useFocus = () => {
    const context = useContext(FocusContext);
    if (!context) {
        throw new Error('useFocus must be used within a FocusProvider');
    }
    return context;
};
