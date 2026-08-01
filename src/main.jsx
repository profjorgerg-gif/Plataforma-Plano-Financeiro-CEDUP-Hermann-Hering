import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { firebaseConfigurado } from "./firebaseApp";
import "./firebaseStorage";
import App from "./App.jsx";

function TelaConfiguracaoPendente() {
  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 560, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Falta um passo: conectar o Firebase</h1>
        <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 12 }}>
          O arquivo <code style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4 }}>src/firebaseConfig.js</code> ainda
          está com os valores de exemplo. Sem isso, a plataforma não consegue salvar turmas, equipes nem lançamentos.
        </p>
        <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
          Siga o passo a passo do <code style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4 }}>README.md</code> do
          repositório para criar um projeto gratuito no Firebase, copiar as 6 chaves de configuração e colá-las nesse arquivo.
          Depois, dê commit/push — o GitHub Actions publica a versão atualizada automaticamente.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {firebaseConfigurado ? <App /> : <TelaConfiguracaoPendente />}
  </React.StrictMode>
);
