import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyATMU5QECu0h2q-efU8JXO3o_CIH34I1wM",
  authDomain: "luckly-5b2ac.firebaseapp.com",
  projectId: "luckly-5b2ac",
  storageBucket: "luckly-5b2ac.appspot.com",
  messagingSenderId: "603522034693",
  appId: "1:603522034693:web:42d14af47a072e20bf006c"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
