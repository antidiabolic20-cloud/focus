/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: '#0B0C15', // Deep void
                    lighter: '#151621',
                },
                primary: {
                    DEFAULT: '#8B5CF6', // Violet 500
                    glow: '#A78BFA',    // Violet 400
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
                    DEFAULT: 'rgba(255, 255, 255, 0.05)',
                    border: 'rgba(255, 255, 255, 0.1)',
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
