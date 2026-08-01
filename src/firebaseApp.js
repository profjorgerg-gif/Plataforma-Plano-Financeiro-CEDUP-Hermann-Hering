// ============================================================================
// Inicializa o Firebase UMA única vez e compartilha a mesma instância entre
// firebaseStorage.js (Firestore) e firebaseAuth.js (Authentication).
// Chamar initializeApp() duas vezes com a mesma config gera erro, por isso
// esse passo fica centralizado aqui.
// ============================================================================

import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";

export const precisaConfigurar = Object.values(firebaseConfig).some(
  (v) => !v || v.includes("COLE_AQUI")
);

export const app = precisaConfigurar ? null : initializeApp(firebaseConfig);
export const firebaseConfigurado = !precisaConfigurar;
