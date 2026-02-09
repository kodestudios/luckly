import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase-auth-proxy.js";

export function watchAuth(cb){
  return onAuthStateChanged(auth, cb);
}

export async function registerAuth(email, password){
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginAuth(email, password){
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutAuth(){
  return signOut(auth);
}
