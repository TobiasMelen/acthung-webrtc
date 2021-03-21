export default ({ command }) => ({
  plugins: [
    command === "serve" ? [require("@vitejs/plugin-react-refresh")()] : [],
  ],
});
