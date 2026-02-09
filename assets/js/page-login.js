import { $ } from "./util.js";
import { loginAuth } from "./auth.js";

const email = $("email");
const password = $("password");
const btn = $("btnLogin");
const msg = $("msg");

btn.onclick = async () => {
  msg.textContent = "Entrando…";
  btn.disabled = true;

  try {
    await loginAuth(
      email.value.trim(),
      password.value // ❗ NO trim
    );

    // dejamos que Firebase confirme auth
    setTimeout(() => {
      location.href = "dashboard.html";
    }, 300);

  } catch (e) {
    console.error(e);
    msg.textContent = "Correo o contraseña incorrectos";
    btn.disabled = false;
  }
};

