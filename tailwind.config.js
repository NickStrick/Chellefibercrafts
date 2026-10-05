module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // theme: {
  //   extend: {
  //     colors: {
  //       darkish: "#0f0f0f", // optional
  //       'purple-custom': 'var(--color-purple)',
  //       'purple-background': 'var(--bg-purple) ',
  //     },
  //   },
  // },
  theme: {
    extend: {
      screens: {
        nav: '1275px',
        mlg: '975px',
        xs: '445px',
      },
      colors: {
        cream: {
          light: "#F5F3E7",  // base cream
          DEFAULT: "#E8DFC7", // light sand
          dark: "#D4B483",    // bamboo beige
        },
        green: {
          light: "#A6C8A1",   // moss green
          DEFAULT: "#7B9E87", // sage shadow
           dark: "#2F5D50",    // forest green
        },
        charcoal: "#4A4A4A",   // accent for typography
      },
    },
  },
  plugins: [],
};
