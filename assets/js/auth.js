import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

export function watchAuth(cb){ return onAuthStateChanged(auth, cb); }
export async function registerAuth(email, password){ return createUserWithEmailAndPassword(auth, email, password); }
export async function loginAuth(email, password){ return signInWithEmailAndPassword(auth, email, password); }
export async function logoutAuth(){ return signOut(auth); }
