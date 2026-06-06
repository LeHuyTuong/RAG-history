/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tông màu Đỏ Cung Đình (Primary)
        primary: {
          DEFAULT: "#570000",
          container: "#800000",
          fixed: "#ffdad4",
          dim: "#ffb4a8",
        },
        // Tông màu Giấy Sáp/Vàng Cổ (Background)
        surface: {
          DEFAULT: "#fbfbe2",
          dim: "#dbdcc3",
          low: "#f5f5dc",
          highest: "#e4e4cc",
          variant: "#e4e4cc",
        },
        // Màu chữ và bổ trợ
        on: {
          surface: "#1b1d0e",
          "surface-variant": "#5a413d",
        },
        outline: {
          DEFAULT: "#8e706c",
          variant: "#e2bfb9",
        },
        accent: "#b8860b", // Màu vàng đồng cho viền
      },
      fontFamily: {
        headline: ["Playfair Display", "serif"], // Tiêu đề trang trọng
        body: ["Manrope", "sans-serif"],        // Văn bản dễ đọc
        label: ["Be Vietnam Pro", "sans-serif"], // Nhãn, chú thích
      },
      spacing: {
        'container-max': '1440px',
      }
    },
  },
  plugins: [require("@tailwindcss/forms")],
};