import { $, slugify } from "./util.js";
import { registerAuth } from "./auth.js";
import { createUserData } from "./firestore.js";

const username = $("username");
const displayName = $("displayName");
const email = $("email");
const password = $("password");
const btn = $("btnRegister");
const msg = $("msg");
const linkPreview = $("linkPreview");

username.addEventListener("input", () => {
  linkPreview.textContent = "/" + slugify(username.value || "tuusuario");
});

btn.onclick = async () => {
  msg.textContent = "Creando...";
  try{
    const slug = slugify(username.value);
    if (!slug || slug.length < 3) throw new Error("Username inválido (mín 3).");
    const dn = (displayName.value || slug).trim();
    const em = email.value.trim();
    const pw = password.value;

    const cred = await registerAuth(em, pw);
    await createUserData({ uid: cred.user.uid, email: em, slug, displayName: dn });

    location.href = "dashboard.html";
  }catch(e){
    msg.textContent = e.message || "Error";
  }
};
