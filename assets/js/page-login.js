import { $ } from "./util.js";
import { loginAuth } from "./auth.js";

const email = $("email");
const password = $("password");
const btn = $("btnLogin");
const msg = $("msg");

btn.onclick = async () => {
  msg.textContent = "Entrando...";
  try{
    await loginAuth(email.value.trim(), password.value);
    location.href = "dashboard.html";
  }catch(e){
    msg.textContent = e.message || "Error";
  }
};
