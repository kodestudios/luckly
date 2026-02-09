// assets/js/auth.js
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

export function watchAuth(cb) {
  console.log("[AUTH] watchAuth registered");
  return onAuthStateChanged(auth, (user) => {
    console.log("[AUTH] state:", user);
    cb(user);
  });
}

export async function logoutAuth() {
  return signOut(auth);
}
