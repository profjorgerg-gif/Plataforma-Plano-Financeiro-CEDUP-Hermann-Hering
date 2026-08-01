import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANTE: "base" precisa ser "/nome-exato-do-repositorio/" para o
// GitHub Pages servir os arquivos corretamente (o site fica em
// https://<usuario>.github.io/<repositorio>/, não na raiz do domínio).
// Se você renomear o repositório, atualize esta linha também.
export default defineConfig({
  plugins: [react()],
  base: "/Plataforma-Plano-Financeiro-CEDUP-Hermann-Hering/",
});
