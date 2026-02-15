import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const FocusContext = createContext();

export function FocusProvider({ children }) {
    // Persist state in localStorage so it survives refreshes
    const [isFocusMode, setIsFocusMode] = useState(() => {
        return localStorage.getItem('isFocusMode') === 'true';
    });

    const [isWarningActive, setIsWarningActive] = useState(false);

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
            enterFullscreen();
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('blur', handleWindowBlur);
        } else {
            exitFullscreen();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            setIsWarningActive(false);
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [isFocusMode, location.pathname]);

    function checkAccess() {
        if (!isFocusMode) return;

        const path = location.pathname;
        const isAllowed = ALLOWED_PATHS.some(allowed =>
            path === allowed || path.startsWith(`${allowed}/`)
        );

        if (!isAllowed) {
            // If on a restricted page, redirect to Dashboard or Focus Dojo
            navigate('/focus');
        }
    }

    function enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => console.log('Fullscreen denied:', err));
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    }

    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.log('Exit fullscreen error:', err));
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }

    function handleVisibilityChange() {
        if (document.hidden && isFocusMode) {
            triggerWarning();
        }
    }

    function handleWindowBlur() {
        if (isFocusMode) {
            triggerWarning();
        }
    }

    function triggerWarning() {
        setIsWarningActive(true);
        // Optional: Play a sound here (if simple beep available)
        // const audio = new Audio('/beep.mp3'); 
        // audio.play().catch(() => {});
    }

    function dismissWarning() {
        setIsWarningActive(false);
        enterFullscreen(); // Re-force fullscreen
    }

    function toggleFocusMode() {
        setIsFocusMode(prev => !prev);
    }

    return (
        <FocusContext.Provider value={{ isFocusMode, toggleFocusMode, isWarningActive, dismissWarning }}>
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
