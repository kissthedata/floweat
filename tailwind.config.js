/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#dfb0f2',
          dark: '#c78ee0',
          light: '#f5e6ff',
        },
        text: {
          primary: '#191919',
          secondary: '#666666',
          tertiary: '#999999',
        },
        border: '#f0f0f0',
        surface: '#fafafa',
        // 파스텔 색상 (캘린더용)
        pastel: {
          breakfast: '#FFE5D0',  // 아침 - 연한 오렌지
          lunch: '#D0F5E5',      // 점심 - 연한 민트
          dinner: '#E5D0FF',     // 저녁 - 연한 퍼플
          yellow: '#FFF4D0',     // 노란색
          pink: '#FFD0E5',       // 핑크
          blue: '#D0E5FF',       // 파란색
          green: '#D0FFE5',      // 녹색
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
    },
  },
  plugins: [],
}
