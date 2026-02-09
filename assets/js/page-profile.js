import { getSlugFromPath } from "./router.js";
import { getUidBySlug, getProfile, getViews, incView } from "./firestore.js";
import { escapeHtml } from "./ui.js";

const slug = getSlugFromPath();
const enter = document.getElementById("enter");
const profileWrap = document.getElementById("profile");

enter.onclick = async () => {
  if (!slug) {
    enter.textContent = "Perfil no encontrado";
    return;
  }

  const uid = await getUidBySlug(slug);
  if (!uid) {
    enter.textContent = "Perfil no encontrado";
    enter.style.cursor = "default";
    return;
  }

  enter.style.display = "none";
  profileWrap.style.display = "block";

  await incView(uid);

  const p = await getProfile(uid);
  const v = await getViews(uid);

  document.getElementById("name").textContent = p?.displayName || slug;
  document.getElementById("bio").textContent = p?.bio || "";
  document.getElementById("views").textContent = String(v);

  const av = document.getElementById("avatar");
  av.src = p?.media?.avatarUrl || "https://dummyimage.com/118x118/111/fff&text=+";

  const dl = document.getElementById("discordLine");
  dl.textContent = p?.discord?.connected
    ? `Discord: ${p.discord.username}`
    : "Discord: no conectado";

  /* -------- BADGES -------- */
  const badges = document.getElementById("badges");
  badges.innerHTML = "";
  (p?.badges || []).forEach(b => {
    const img = document.createElement("img");
    img.className = "badge";
    img.src = b.img;
    img.alt = b.name || "badge";
    badges.appendChild(img);
  });

  /* -------- SOCIALS + LINKS (NUEVO) -------- */
  // p.socials debe ser algo como:
  // [{ label:"Discord", url:"https://discord.gg/xxx" }, ...]
  if (window.renderLinks) {
    window.renderLinks(p?.socials || []);
  }

  /* -------- AUDIO -------- */
  const audioWrap = document.getElementById("audioWrap");
  audioWrap.innerHTML = "";
  if (p?.media?.audioUrl) {
    audioWrap.innerHTML = `
      <audio controls autoplay loop style="width:100%">
        <source src="${escapeHtml(p.media.audioUrl)}">
      </audio>
    `;
  }

  /* -------- VIDEO -------- */
  const videoWrap = document.getElementById("videoWrap");
  videoWrap.innerHTML = "";
  if (p?.media?.videoUrl) {
    videoWrap.innerHTML = `
      <video controls autoplay loop muted playsinline
        style="width:100%;border-radius:18px;border:1px solid rgba(255,255,255,.12);">
        <source src="${escapeHtml(p.media.videoUrl)}">
      </video>
    `;
  }
};
