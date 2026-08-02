// ============================================================================
// Autenticação real (Firebase Authentication) — cadastro com e-mail/senha,
// login, recuperação de senha e logout.
//
// CÓDIGO DE MESTRE: quem digitar esse código corretamente no cadastro (como
// professor) já entra aprovado como Usuário Mestre, sem esperar aprovação —
// é o "pontapé inicial" para existir alguém que possa aprovar os demais.
//
// IMPORTANTE — leia antes de publicar a plataforma para a escola:
// este repositório é PÚBLICO no GitHub, então qualquer pessoa que abrir o
// código-fonte consegue ver o valor abaixo. Troque-o por algo só seu antes
// de divulgar o link da plataforma, e trate-o como uma trava simples (evita
// que alguém vire Mestre "sem querer"), não como um segredo forte.
// ============================================================================

import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, updateProfile,
} from "firebase/auth";
import { app } from "./firebaseApp";

export const CODIGO_MESTRE = "CEDUP-HH-CUK5HE";

export const auth = app ? getAuth(app) : null;

export function observarSessao(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

export async function cadastrar(email, senha, nome) {
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  await updateProfile(cred.user, { displayName: nome });
  return cred.user;
}

export async function entrar(email, senha) {
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

export async function sair() {
  await signOut(auth);
}

export async function recuperarSenha(email) {
  await sendPasswordResetEmail(auth, email);
}

export function traduzErroAuth(err) {
  const c = err?.code || "";
  const map = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/missing-password": "Digite uma senha.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas seguidas. Aguarde um pouco e tente novamente.",
    "auth/network-request-failed": "Falha de conexão. Verifique a internet e tente novamente.",
  };
  return map[c] || "Não foi possível concluir a operação. Tente novamente.";
}
