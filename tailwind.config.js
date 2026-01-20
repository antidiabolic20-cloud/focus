/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: 'rgb(var(--background) / <alpha-value>)',
                    lighter: 'rgb(var(--background-lighter) / <alpha-value>)',
                },
                primary: {
                    DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
                    glow: 'rgb(var(--primary-glow) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: '#3B82F6', // Blue 500
                    glow: '#60A5FA',    // Blue 400
                },
                accent: {
                    DEFAULT: '#EC4899', // Pink 500
                    glow: '#F472B6',    // Pink 400
                },
                glass: {
                    DEFAULT: 'var(--glass)',
                    border: 'var(--glass-border)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'neon-purple': '0 0 10px rgba(139, 92, 246, 0.5)',
                'neon-blue': '0 0 10px rgba(59, 130, 246, 0.5)',
            }
        },
    },
    plugins: [],
}
