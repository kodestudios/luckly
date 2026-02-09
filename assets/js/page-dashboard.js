import { copyText } from "./util.js";
import { watchAuth, logoutAuth } from "./auth.js";
import { ADMIN_EMAILS } from "./admin.js";
import {
  getUser,
  getProfile,
  updateProfile,
  getViews,
  findUidByEmail,
  addBadge
} from "./firestore.js";
import { uploadUserFile } from "./storage.js";
import { setActiveTab, renderSocials } from "./ui.js";
import { discordConnect } from "./discord.js";

/* ==========================
   UTIL: COMPRESIÓN DE AVATAR
   (< 1 MB GARANTIZADO)
========================== */
function compressImage(file, maxSize = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject("Archivo no válido");
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => (img.src = e.target.result);
    reader.onerror = reject;

    img.onload = () => {
      let { width, height } = img;

      if (width > height && width > maxSize) {
        height = Math.round(height * (maxSize / width));
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round(width * (maxSize / height));
        height = maxSize;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (!blob) reject("Error al comprimir");
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}

/* ==========================
   DOM: TABS
========================== */
const tabs = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".panel")];

tabs.forEach(tab => {
  tab.onclick = () => setActiveTab(tabs, panels, tab.dataset.tab);
});

/* ==========================
   LOGOUT
========================== */
document.getElementById("btnLogout").onclick = async () => {
  await logoutAuth();
  location.href = "login.html";
};

/* ==========================
   AUTH + DASHBOARD INIT
========================== */
watchAuth(async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  await getUser(user.uid);
  let profile = await getProfile(user.uid);
  const views = await getViews(user.uid);

  /* ==========================
     DISCORD CALLBACK
  ========================= */
  const pending = localStorage.getItem("discord_pending");
  if (pending) {
    const discord = JSON.parse(pending);
    const isGif = discord.avatar?.startsWith("a_");
    const ext = isGif ? "gif" : "png";

    const avatarUrl = discord.avatar
      ? `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.${ext}`
      : null;

    await updateProfile(user.uid, {
      discord: {
        connected: true,
        id: discord.id,
        username: discord.username,
        avatar: discord.avatar,
        avatarUrl
      }
    });

    localStorage.removeItem("discord_pending");
    location.reload();
    return;
  }

  /* ==========================
     BASIC INFO
  ========================= */
  document.getElementById("meEmail").textContent = user.email || "";
  document.getElementById("meName").textContent = profile?.displayName || "User";
  document.getElementById("meSlug").textContent = "/" + (profile?.slug || "");
  document.getElementById("myLinkChip").textContent = "/" + (profile?.slug || "");
  document.getElementById("viewCount").textContent = String(views);

  /* ==========================
     AVATAR DISPLAY
  ========================= */
  const avatarEl = document.getElementById("meAvatar");
  const avatarUrl =
    profile?.discord?.avatarUrl ||
    profile?.media?.avatarUrl ||
    "";

  if (avatarUrl) {
    avatarEl.src = avatarUrl + "?v=" + Date.now();
  } else {
    avatarEl.removeAttribute("src");
  }

  /* ==========================
     PROFILE LINK
  ========================= */
  const fullLink = profile?.slug
    ? `https://kodestudios.github.io/luckly/${profile.slug}`
    : "#";

  document.getElementById("btnOpenProfile").href = fullLink;
  document.getElementById("btnCopyLink").onclick = () => copyText(fullLink);

  /* ==========================
     DISCORD UI
  ========================= */
  document.getElementById("discordInfo").textContent =
    profile?.discord?.connected
      ? `Discord: ${profile.discord.username}`
      : "Discord: no conectado";

  document.getElementById("btnDiscord").onclick = () =>
    discordConnect("TU_PROJECT_ID");

  /* ==========================
     BIO
  ========================= */
  const bioEl = document.getElementById("bio");
  bioEl.value = profile?.bio || "";

  document.getElementById("btnSaveBio").onclick = async () => {
    await updateProfile(user.uid, { bio: bioEl.value });
    document.getElementById("msgBio").textContent = "Bio guardada ✔";
  };

  /* ==========================
     SOCIALS
  ========================= */
  let socials = profile?.socials || [];
  const socialList = document.getElementById("socialList");

  const refreshSocials = async () => {
    renderSocials(socialList, socials, async (index) => {
      socials.splice(index, 1);
      await updateProfile(user.uid, { socials });
      refreshSocials();
    });
  };

  refreshSocials();

  document.getElementById("btnAddSocial").onclick = async () => {
    const label = document.getElementById("socialLabel").value.trim();
    const url = document.getElementById("socialUrl").value.trim();
    if (!url) return;

    socials.push({ label, url });
    await updateProfile(user.uid, { socials });
    refreshSocials();
  };

  document.getElementById("btnClearSocials").onclick = async () => {
    socials = [];
    await updateProfile(user.uid, { socials });
    refreshSocials();
  };

  /* ==========================
     AVATAR UPLOAD (PRO)
  ========================= */
  document.getElementById("btnUploadAvatar").onclick = async () => {
    const input = document.getElementById("avatarFile");
    const msg = document.getElementById("msgAvatar");
    const file = input.files?.[0];
    if (!file) return;

    msg.textContent = "Procesando imagen…";

    try {
      const compressed = await compressImage(file);

      if (compressed.size > 1024 * 1024) {
        msg.textContent = "La imagen es demasiado grande";
        return;
      }

      const url = await uploadUserFile(
        user.uid,
        compressed,
        "avatar",
        "image/jpeg"
      );

      await updateProfile(user.uid, {
        media: { ...profile.media, avatarUrl: url }
      });

      avatarEl.src = url + "?v=" + Date.now();
      msg.textContent = "Avatar actualizado ✔";
      input.value = "";

    } catch (err) {
      console.error(err);
      msg.textContent = "Error al subir avatar";
    }
  };

  /* ==========================
     ADMIN
  ========================= */
  const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  if (!isAdmin) {
    const adminTab = document.querySelector('[data-tab="admin"]');
    if (adminTab) adminTab.style.display = "none";
  } else {
    document.getElementById("btnGiveBadge").onclick = async () => {
      const email = document.getElementById("badgeEmail").value.trim();
      const badgeKey = document.getElementById("badgeSelect").value;

      const uid = await findUidByEmail(email);
      if (!uid) return;

      await addBadge(uid, {
        key: badgeKey,
        name: badgeKey,
        img: `assets/badges/${badgeKey}.png`
      });
    };
  }
});
