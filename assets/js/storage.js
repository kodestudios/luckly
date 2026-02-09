import { storage } from "./firebase.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

export async function uploadUserFile(uid, file, kind){
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `users/${uid}/${kind}.${ext}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}
