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
    if (!file || !file.type.startsWith("image/")) {
      reject("No es imagen");
      return;
    }

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
        blob => (blob ? resolve(blob) : reject("Error")),
        "image/jpeg",
        quality
      );
    };
  });
}

/* ==========================
   TABS (SAFE)
========================== */
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
if (tabs.length && panels.length) {
  tabs.forEach(t =>
    t.addEventListener("click", () =>
      setActiveTab([...tabs], [...panels], t.dataset.tab)
    )
  );
}

/* ==========================
   LOGOUT
========================== */
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.onclick = async () => {
    await logoutAuth();
    location.href = "login.html";
  };
}

/* ==========================
   AUTH
========================== */
watchAuth(async user => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  await getUser(user.uid);
  let profile = await getProfile(user.uid);
  const views = await getViews(user.uid);

  /* ===== BASIC INFO ===== */
  const meEmail = document.getElementById("meEmail");
  const meName = document.getElementById("meName");
  const meSlug = document.getElementById("meSlug");
  const myLinkChip = document.getElementById("myLinkChip");
  const viewCount = document.getElementById("viewCount");

  if (meEmail) meEmail.textContent = user.email || "";
  if (meName) meName.textContent = profile?.displayName || "User";
  if (meSlug) meSlug.textContent = "/" + (profile?.slug || "");
  if (myLinkChip) myLinkChip.textContent = "/" + (profile?.slug || "");
  if (viewCount) viewCount.textContent = String(views);

  /* ===== AVATAR ===== */
  const meAvatar = document.getElementById("meAvatar");
  const avatarUrl =
    profile?.discord?.avatarUrl ||
    profile?.media?.avatarUrl ||
    "";
  if (meAvatar && avatarUrl) {
    meAvatar.src = avatarUrl + "?v=" + Date.now();
  }

  /* ===== LINK PERFIL ===== */
  const btnOpenProfile = document.getElementById("btnOpenProfile");
  const btnCopyLink = document.getElementById("btnCopyLink");

  const fullLink = profile?.slug
    ? `https://kodestudios.github.io/luckly/${profile.slug}`
    : "#";

  if (btnOpenProfile) btnOpenProfile.href = fullLink;
  if (btnCopyLink) btnCopyLink.onclick = () => copyText(fullLink);

  /* ===== DISCORD ===== */
  const discordInfo = document.getElementById("discordInfo");
  const btnDiscord = document.getElementById("btnDiscord");

  if (discordInfo) {
    discordInfo.textContent = profile?.discord?.connected
      ? `Discord: ${profile.discord.username}`
      : "Discord: no conectado";
  }

  if (btnDiscord) {
    btnDiscord.onclick = () => discordConnect("TU_PROJECT_ID");
  }

  /* ===== BIO ===== */
  const bio = document.getElementById("bio");
  const btnSaveBio = document.getElementById("btnSaveBio");
  const msgBio = document.getElementById("msgBio");

  if (bio) bio.value = profile?.bio || "";
  if (btnSaveBio) {
    btnSaveBio.onclick = async () => {
      await updateProfile(user.uid, { bio: bio.value });
      if (msgBio) msgBio.textContent = "Bio guardada ✔";
    };
  }

  /* ===== AVATAR UPLOAD ===== */
  const avatarFile = document.getElementById("avatarFile");
  const btnUploadAvatar = document.getElementById("btnUploadAvatar");
  const msgAvatar = document.getElementById("msgAvatar");

  if (btnUploadAvatar && avatarFile) {
    btnUploadAvatar.onclick = async () => {
      const file = avatarFile.files?.[0];
      if (!file) return;

      if (msgAvatar) msgAvatar.textContent = "Procesando…";

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

        if (meAvatar) meAvatar.src = url + "?v=" + Date.now();
        if (msgAvatar) msgAvatar.textContent = "Avatar actualizado ✔";
        avatarFile.value = "";
      } catch {
        if (msgAvatar) msgAvatar.textContent = "Error al subir";
      }
    };
  }

  /* ===== ADMIN (SAFE) ===== */
  const adminTab = document.querySelector('[data-tab="admin"]');
  const badgeSelect = document.getElementById("badgeSelect");
  const badgeEmail = document.getElementById("badgeEmail");
  const btnGiveBadge = document.getElementById("btnGiveBadge");

  const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  if (!isAdmin) {
    if (adminTab) adminTab.style.display = "none";
    return;
  }

  if (badgeSelect && btnGiveBadge && badgeEmail) {
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
  }
});
