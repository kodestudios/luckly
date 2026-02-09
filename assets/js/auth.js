// assets/js/auth.js
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

/* =========================
   WATCH AUTH
========================= */
export function watchAuth(cb) {
  console.log("[AUTH] watchAuth registered");
  return onAuthStateChanged(auth, (user) => {
    console.log("[AUTH] state:", user);
    cb(user);
  });
}

/* =========================
   LOGIN
========================= */
export async function loginAuth(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/* =========================
   REGISTER
========================= */
export async function registerAuth(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/* =========================
   LOGOUT
========================= */
export async function logoutAuth() {
  return signOut(auth);
}
