import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANTE: "base" define de onde o site carrega os arquivos.
// "/" = raiz do domínio (usado com domínio próprio, ex.: ppfn.com.br/).
// Se algum dia voltar a depender só do link padrão do GitHub Pages
// (usuario.github.io/repositorio/), essa linha precisaria voltar a ser
// "/Plataforma-Plano-Financeiro-CEDUP-Hermann-Hering/".
export default defineConfig({
  plugins: [react()],
  base: "/",
});
