import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                clay: {
                    charcoal: '#343434', // Primary text, dark badges, active frames
                    gold: '#E6B31E',     // Primary accent, active switches, highlights
                    cream: '#FCFAF1',    // Main background & raised clay card surface
                    gray: '#CACACA',     // Muted borders, recessed wells, clay shading
                },
            },
        },
    },

    plugins: [forms],
};