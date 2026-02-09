import { copyText } from "./util.js";
import { watchAuth, logoutAuth } from "./auth.js";
import { ADMIN_EMAILS } from "./admin.js";
import {
  getUser,
  getProfile,
  updateProfile,
  getViews,
  findUidByEmail
} from "./firestore.js";
import { uploadUserFile } from "./storage.js";
import { setActiveTab, renderSocials } from "./ui.js";
import { discordConnect } from "./discord.js";
import { BADGES } from "../badges/badges.manifest.js";

/* ==========================
   UTIL: COMPRESIÓN AVATAR
========================== */
function compressImage(file, maxSize = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject("No es imagen");

    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => (img.src = e.target.result);
    reader.readAsDataURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      } else if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject("Error"),
        "image/jpeg",
        quality
      );
    };
  });
}

/* ==========================
   TABS
========================== */
const tabs = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".panel")];
tabs.forEach(t => t.onclick = () => setActiveTab(tabs, panels, t.dataset.tab));

/* ==========================
   LOGOUT
========================== */
document.getElementById("btnLogout").onclick = async () => {
  await logoutAuth();
  location.href = "login.html";
};

/* ==========================
   AUTH
========================== */
watchAuth(async user => {
  if (!user) return (location.href = "login.html");

  await getUser(user.uid);
  let profile = await getProfile(user.uid);
  const views = await getViews(user.uid);

  /* ===== INFO ===== */
  meEmail.textContent = user.email || "";
  meName.textContent = profile?.displayName || "User";
  meSlug.textContent = "/" + (profile?.slug || "");
  myLinkChip.textContent = "/" + (profile?.slug || "");
  viewCount.textContent = views;

  /* ===== AVATAR ===== */
  const avatarUrl =
    profile?.discord?.avatarUrl ||
    profile?.media?.avatarUrl ||
    "";
  if (avatarUrl) meAvatar.src = avatarUrl + "?v=" + Date.now();

  /* ===== LINK PERFIL ===== */
  const fullLink = profile?.slug
    ? `https://kodestudios.github.io/luckly/${profile.slug}`
    : "#";
  btnOpenProfile.href = fullLink;
  btnCopyLink.onclick = () => copyText(fullLink);

  /* ===== DISCORD ===== */
  discordInfo.textContent = profile?.discord?.connected
    ? `Discord: ${profile.discord.username}`
    : "Discord: no conectado";

  btnDiscord.onclick = () => discordConnect("TU_PROJECT_ID");

  /* ===== BIO ===== */
  bio.value = profile?.bio || "";
  btnSaveBio.onclick = async () => {
    await updateProfile(user.uid, { bio: bio.value });
    msgBio.textContent = "Bio guardada ✔";
  };

  /* ===== SOCIALS ===== */
  let socials = profile?.socials || [];
  const refreshSocials = () => {
    renderSocials(socialList, socials, async i => {
      socials.splice(i, 1);
      await updateProfile(user.uid, { socials });
      refreshSocials();
    });
  };
  refreshSocials();

  btnAddSocial.onclick = async () => {
    if (!socialUrl.value) return;
    socials.push({ label: socialLabel.value, url: socialUrl.value });
    await updateProfile(user.uid, { socials });
    refreshSocials();
  };

  btnClearSocials.onclick = async () => {
    socials = [];
    await updateProfile(user.uid, { socials });
    refreshSocials();
  };

  /* ===== AVATAR UPLOAD ===== */
  btnUploadAvatar.onclick = async () => {
    const file = avatarFile.files?.[0];
    if (!file) return;

    msgAvatar.textContent = "Procesando…";
    try {
      const blob = await compressImage(file);
      const url = await uploadUserFile(
        user.uid,
        blob,
        "avatar",
        "image/jpeg"
      );

      await updateProfile(user.uid, {
        media: { ...profile.media, avatarUrl: url }
      });

      meAvatar.src = url + "?v=" + Date.now();
      msgAvatar.textContent = "Avatar actualizado ✔";
      avatarFile.value = "";
    } catch {
      msgAvatar.textContent = "Error al subir";
    }
  };

  /* ===== ADMIN ===== */
  const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
  if (!isAdmin) {
    document.querySelector('[data-tab="admin"]').style.display = "none";
    return;
  }

  // Poblar select desde MANIFEST
  badgeSelect.innerHTML = "";
  BADGES.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.key;
    opt.textContent = b.name;
    badgeSelect.appendChild(opt);
  });

  btnGiveBadge.onclick = async () => {
    const email = badgeEmail.value.trim();
    if (!email) return;

    const badge = BADGES.find(b => b.key === badgeSelect.value);
    if (!badge) return;

    const uid = await findUidByEmail(email);
    if (!uid) return;

    const targetProfile = await getProfile(uid);
    const current = targetProfile?.badges || [];

    if (current.some(b => b.key === badge.key)) {
      alert("La insignia ya existe");
      return;
    }

    await updateProfile(uid, {
      badges: [...current, badge]
    });

    alert("Insignia asignada ✔");
  };
});
