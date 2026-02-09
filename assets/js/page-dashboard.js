import { copyText } from "./util.js";
import { watchAuth, logoutAuth } from "./auth.js";
import {
  getUser,
  getProfile,
  updateProfile,
  getViews,
  findUidByEmail
} from "./firestore.js";
import { ADMIN_EMAILS } from "./admin.js";
import { uploadUserFile } from "./storage.js";
import { setActiveTab } from "./ui.js";
import { discordConnect } from "./discord.js";
import { BADGES } from "./badges/badges.manifest.js"; // 👈 RUTA CORRECTA

/* ==========================
   HELPERS
========================== */
const $ = (id) => document.getElementById(id);

/* ==========================
   DOM
========================== */
const meAvatar = $("meAvatar");
const meName = $("meName");
const meSlug = $("meSlug");
const meEmail = $("meEmail");

const myLinkChip = $("myLinkChip");
const viewCount = $("viewCount");

const btnOpenProfile = $("btnOpenProfile");
const btnCopyLink = $("btnCopyLink");
const btnLogout = $("btnLogout");

const btnDiscord = $("btnDiscord");
const discordInfo = $("discordInfo");

const avatarFile = $("avatarFile");
const btnUploadAvatar = $("btnUploadAvatar");
const msgAvatar = $("msgAvatar");

const bio = $("bio");
const btnSaveBio = $("btnSaveBio");
const msgBio = $("msgBio");

const badgeEmail = $("badgeEmail");
const badgeSelect = $("badgeSelect");
const btnGiveBadge = $("btnGiveBadge");

/* ==========================
   TABS
========================== */
const tabs = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".panel")];

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    setActiveTab(tabs, panels, tab.dataset.tab);
  });
});

/* ==========================
   LOGOUT
========================== */
btnLogout.addEventListener("click", async () => {
  await logoutAuth();
  location.href = "login.html";
});

/* ==========================
   AUTH / INIT
========================== */
watchAuth(async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  try {
    /* ===== USER ===== */
    await getUser(user.uid);
    const profile = await getProfile(user.uid);
    const views = await getViews(user.uid);

    /* ===== BASIC INFO ===== */
    meName.textContent = profile?.displayName || "User";
    meSlug.textContent = "/" + (profile?.slug || "");
    meEmail.textContent = user.email || "";
    myLinkChip.textContent = "/" + (profile?.slug || "");
    viewCount.textContent = views ?? 0;

    /* ===== AVATAR (🔥 FIX DEFINITIVO) ===== */
    const avatarUrl =
      profile?.media?.avatarUrl ||
      profile?.discord?.avatarUrl ||
      "";

    meAvatar.src = avatarUrl
      ? avatarUrl + "?v=" + Date.now()
      : "https://dummyimage.com/128x128/444/fff&text=User";

    /* ===== PROFILE LINK ===== */
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

    /* ===== AVATAR UPLOAD ===== */
    btnUploadAvatar.onclick = async () => {
      const file = avatarFile.files?.[0];
      if (!file) return;

      msgAvatar.textContent = "Subiendo…";

      try {
        const url = await uploadUserFile(user.uid, file, "avatar");

        await updateProfile(user.uid, {
          media: { ...(profile.media || {}), avatarUrl: url }
        });

        meAvatar.src = url + "?v=" + Date.now();
        msgAvatar.textContent = "Avatar actualizado ✔";
        avatarFile.value = "";
      } catch (e) {
        console.error(e);
        msgAvatar.textContent = "Error al subir avatar";
      }
    };

    /* ===== ADMIN / BADGES ===== */
    const isAdmin = ADMIN_EMAILS.includes(
      (user.email || "").toLowerCase()
    );

    const adminTab = document.querySelector('[data-tab="admin"]');
    if (!isAdmin) {
      if (adminTab) adminTab.style.display = "none";
      return;
    }

    /* === CARGAR INSIGNIAS === */
    badgeSelect.innerHTML = "";
    BADGES.forEach(badge => {
      const opt = document.createElement("option");
      opt.value = badge.key;
      opt.textContent = badge.name;
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

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    alert("Error en dashboard. Revisá la consola.");
  }
});
