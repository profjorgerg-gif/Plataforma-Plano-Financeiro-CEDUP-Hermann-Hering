// ============================================================================
// Autenticação real (Firebase Authentication) — login somente com conta
// Google. Não existe mais cadastro com e-mail/senha: o provedor "E-mail/senha"
// foi desativado no Console do Firebase, e o único jeito de entrar é pelo
// botão "Continuar com Google".
//
// CÓDIGO DE MESTRE: quem digitar esse código corretamente no primeiro acesso
// (como professor) já entra aprovado como Usuário Mestre, sem esperar
// aprovação — é o "pontapé inicial" para existir alguém que possa aprovar
// os demais.
//
// IMPORTANTE — leia antes de publicar a plataforma para a escola:
// este repositório é PÚBLICO no GitHub, então qualquer pessoa que abrir o
// código-fonte consegue ver o valor abaixo. Troque-o por algo só seu antes
// de divulgar o link da plataforma, e trate-o como uma trava simples (evita
// que alguém vire Mestre "sem querer"), não como um segredo forte.
// ============================================================================
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from "firebase/auth";
import { app } from "./firebaseApp";

export const CODIGO_MESTRE = "623251@_@prof";
export const auth = app ? getAuth(app) : null;

const googleProvider = new GoogleAuthProvider();
// Evita a tela intermediária "Escolha uma conta" quando a pessoa só tem uma
// conta Google logada no navegador; se tiver mais de uma, o Google mostra a
// escolha normalmente.
googleProvider.setCustomParameters({ prompt: "select_account" });

export function observarSessao(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function entrarComGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function sair() {
  await signOut(auth);
}

export function traduzErroAuth(err) {
  const c = err?.code || "";
  const map = {
    "auth/popup-closed-by-user": "A janela do Google foi fechada antes de concluir. Tente novamente.",
    "auth/cancelled-popup-request": "Só é possível ter uma janela de login por vez. Tente novamente.",
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente de novo.",
    "auth/account-exists-with-different-credential": "Este e-mail já está associado a outra forma de login.",
    "auth/network-request-failed": "Falha de conexão. Verifique a internet e tente novamente.",
    "auth/too-many-requests": "Muitas tentativas seguidas. Aguarde um pouco e tente novamente.",
  };
  return map[c] || "Não foi possível entrar com o Google. Tente novamente.";
}
