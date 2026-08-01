// ============================================================================
// Substitui, com a MESMA assinatura, a API window.storage que a plataforma
// usa (get/set/delete/list). Dentro do Claude.ai essa API é fornecida pelo
// ambiente de artefatos; fora dele (como aqui, hospedado no GitHub Pages),
// implementamos a mesma interface por cima do Firestore, então nenhuma linha
// de App.jsx precisa mudar.
//
// Toda a plataforma sempre chama window.storage com shared=true (os dados são
// intencionalmente compartilhados entre professor e equipes), então guardamos
// tudo em uma única coleção "kv" do Firestore, um documento por chave.
// ============================================================================

import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs,
} from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

const precisaConfigurar = Object.values(firebaseConfig).some((v) => !v || v.includes("COLE_AQUI"));

let db = null;
if (!precisaConfigurar) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// Firestore não aceita "/" em IDs de documento; nossas chaves não usam "/",
// mas sanitizamos mesmo assim por segurança.
const sanitize = (key) => key.replace(/[\/\.\#\$\[\]]/g, "_");

window.storage = {
  async get(key, shared) {
    if (!db) throw new Error("Firebase não configurado. Preencha src/firebaseConfig.js.");
    const ref = doc(db, "kv", sanitize(key));
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { key, value: snap.data().value, shared: !!shared };
  },

  async set(key, value, shared) {
    if (!db) throw new Error("Firebase não configurado. Preencha src/firebaseConfig.js.");
    const ref = doc(db, "kv", sanitize(key));
    await setDoc(ref, { value, shared: !!shared, atualizadoEm: Date.now() });
    return { key, value, shared: !!shared };
  },

  async delete(key, shared) {
    if (!db) throw new Error("Firebase não configurado. Preencha src/firebaseConfig.js.");
    const ref = doc(db, "kv", sanitize(key));
    await deleteDoc(ref);
    return { key, deleted: true, shared: !!shared };
  },

  async list(prefix, shared) {
    if (!db) throw new Error("Firebase não configurado. Preencha src/firebaseConfig.js.");
    const snaps = await getDocs(collection(db, "kv"));
    const keys = [];
    snaps.forEach((d) => {
      if (!prefix || d.id.startsWith(sanitize(prefix))) keys.push(d.id);
    });
    return { keys, prefix, shared: !!shared };
  },
};

export const firebaseConfigurado = !precisaConfigurar;
