import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "/GaiaFit/" é necessário pro GitHub Pages, já que o site fica em
// lua-b.github.io/GaiaFit (não na raiz do domínio). Em dev continua "/" pra
// não mudar a URL do localhost.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/GaiaFit/" : "/",
}));
