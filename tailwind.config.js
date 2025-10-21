/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          magenta: '#ec008c',
          magentaDark: '#b4006f',
          magentaLight: '#ffe3f5',
          purple: '#6d1369',
          plum: '#320a2b',
          sand: '#fdf6fa',
        },
      },
      boxShadow: {
        brand: '0 22px 45px -20px rgba(236, 0, 140, 0.45)',
        brandSoft: '0 18px 35px -18px rgba(236, 0, 140, 0.25)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #ffecf8 0%, #ffd9ef 45%, #f8a4d0 100%)',
      },
    },
  },
  plugins: [],
}
