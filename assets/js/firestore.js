// assets/js/firestore.js
import { db } from "./firebase.js";
import {
  doc, getDoc, updateDoc, runTransaction,
  serverTimestamp, increment, arrayUnion,
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ==========================
   USER CREATION
========================== */
export async function createUserData({ uid, email, slug, displayName }){
  await runTransaction(db, async (tx) => {
    const slugRef = doc(db, "slugs", slug);
    const slugSnap = await tx.get(slugRef);
    if (slugSnap.exists()) throw new Error("Ese username ya existe.");

    tx.set(slugRef, { uid, slug, createdAt: serverTimestamp() });

    tx.set(doc(db, "users", uid), {
      email,
      slug,
      displayName,
      role: "user",
      createdAt: serverTimestamp()
    });

    tx.set(doc(db, "profiles", uid), {
      uid,
      slug,
      displayName,
      bio: "Bienvenido!",
      theme: { primary: "#FFD000" },
      socials: [],
      media: {
        avatarUrl: "",
        videoUrl: "",
        audioUrl: ""
      },
      badges: [],
      discord: {
        connected: false,
        id: "",
        username: "",
        avatar: ""
      },
      updatedAt: serverTimestamp()
    });

    tx.set(doc(db, "views", uid), { count: 0 });
  });
}

/* ==========================
   GETTERS
========================== */
export async function getUser(uid){
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function getProfile(uid){
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? snap.data() : null;
}

export async function getUidBySlug(slug){
  const snap = await getDoc(doc(db, "slugs", slug));
  return snap.exists() ? snap.data().uid : null;
}

export async function getViews(uid){
  const snap = await getDoc(doc(db, "views", uid));
  return snap.exists() ? (snap.data().count || 0) : 0;
}

/* ==========================
   UPDATES
========================== */
export async function updateProfile(uid, data){
  await updateDoc(doc(db, "profiles", uid), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function incView(uid){
  await updateDoc(doc(db, "views", uid), {
    count: increment(1)
  });
}

export async function findUidByEmail(email){
  const q = query(collection(db, "users"), where("email", "==", email));
  const s = await getDocs(q);
  if (s.empty) return null;
  return s.docs[0].id;
}

export async function addBadge(uid, badgeObj){
  await updateDoc(doc(db, "profiles", uid), {
    badges: arrayUnion(badgeObj),
    updatedAt: serverTimestamp()
  });
}

/* ==========================
   DEBUG (EXPOSICIÓN GLOBAL)
   ⚠️ SOLO PARA DEV
========================== */
window.getProfile = getProfile;
window.getUidBySlug = getUidBySlug;
window.findUidByEmail = findUidByEmail;
