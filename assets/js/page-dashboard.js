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
import { BADGES } from "./badges/badges.manifest.js";

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

/* LINKS */
const linkUrl = $("linkUrl");
const linkLabel = $("linkLabel");
const btnAddLink = $("btnAddLink");
const linksList = $("linksList");

/* ADMIN */
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
btnLogout.onclick = async () => {
  await logoutAuth();
  location.href = "login.html";
};

/* ==========================
   AUTH / INIT
========================== */
watchAuth(async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  try {
    await getUser(user.uid);
    let profile = await getProfile(user.uid);
    const views = await getViews(user.uid);

    /* ===== BASIC INFO ===== */
    meName.textContent = profile?.displayName || "User";
    meSlug.textContent = "/" + (profile?.slug || "");
    meEmail.textContent = user.email || "";
    myLinkChip.textContent = "/" + (profile?.slug || "");
    viewCount.textContent = views ?? 0;

    /* ===== AVATAR ===== */
    const avatarUrl =
      profile?.media?.avatarUrl ||
      profile?.discord?.avatarUrl ||
      "";

    meAvatar.src = avatarUrl
      ? avatarUrl + "?v=" + Date.now()
      : "./assets/img/avatar-placeholder.png";

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

    btnDiscord.onclick = () => discordConnect("1470166797708955758");

    /* ===== BIO ===== */
    bio.value = profile?.bio || "";
    btnSaveBio.onclick = async () => {
      await updateProfile(user.uid, { bio: bio.value });
      msgBio.textContent = "Bio guardada ✔";
      alert("Bio guardada ✔");
    };

    /* ==========================
       AVATAR UPLOAD (FIX TOTAL)
    ========================== */
    btnUploadAvatar.onclick = async () => {
      const file = avatarFile.files?.[0];
      if (!file) {
        msgAvatar.textContent = "Seleccioná una imagen";
        return;
      }

      msgAvatar.textContent = "Subiendo…";
      btnUploadAvatar.disabled = true;

      try {
        const url = await uploadUserFile(user.uid, file, "avatar");
        if (!url) throw new Error("URL no recibida");

        await updateProfile(user.uid, {
          media: {
            ...(profile.media || {}),
            avatarUrl: url
          }
        });

        meAvatar.src = url + "?v=" + Date.now();
        localStorage.setItem("avatarUpdated", "1");

        msgAvatar.textContent = "Avatar actualizado ✔";
        alert("Avatar actualizado correctamente ✔");
        avatarFile.value = "";
      } catch (err) {
        console.error("AVATAR ERROR:", err);
        msgAvatar.textContent = "Error al subir avatar";
        alert("Error al subir avatar");
      } finally {
        btnUploadAvatar.disabled = false;
      }
    };

    /* ==========================
       LINKS / REDES
    ========================== */
    function renderLinksList() {
      linksList.innerHTML = "";
      const links = profile.links || [];

      if (!links.length) {
        linksList.textContent = "No hay enlaces aún";
        return;
      }

      links.forEach((l, i) => {
        const div = document.createElement("div");
        div.className = "link-item";
        div.innerHTML = `
          <span>${l.label || l.url}</span>
          <button class="btn">Eliminar</button>
        `;

        div.querySelector("button").onclick = async () => {
          const updated = links.filter((_, idx) => idx !== i);
          await updateProfile(user.uid, { links: updated });
          profile.links = updated;
          renderLinksList();
          localStorage.setItem("linksUpdated", "1");
        };

        linksList.appendChild(div);
      });
    }

    renderLinksList();

    btnAddLink.onclick = async () => {
      const url = linkUrl.value.trim();
      const label = linkLabel.value.trim();

      if (!url) {
        alert("Poné un link válido");
        return;
      }

      const links = profile.links || [];
      links.push({ url, label });

      await updateProfile(user.uid, { links });
      profile.links = links;

      linkUrl.value = "";
      linkLabel.value = "";

      renderLinksList();
      localStorage.setItem("linksUpdated", "1");
      alert("Enlace agregado ✔");
    };

    /* ==========================
       ADMIN / BADGES
    ========================== */
    const isAdmin = ADMIN_EMAILS.includes(
      (user.email || "").toLowerCase()
    );

    const adminTab = document.querySelector('[data-tab="admin"]');
    if (!isAdmin) {
      if (adminTab) adminTab.style.display = "none";
      return;
    }

    badgeSelect.innerHTML = "";
    BADGES.forEach(badge => {
      const opt = document.createElement("option");
      opt.value = badge.key;
      opt.textContent = badge.name;
      badgeSelect.appendChild(opt);
    });

    btnGiveBadge.onclick = async () => {
      const email = badgeEmail.value.trim();
      if (!email) return alert("Ingresá un email");

      const badge = BADGES.find(b => b.key === badgeSelect.value);
      if (!badge) return;

      const uid = await findUidByEmail(email);
      if (!uid) return alert("Usuario no encontrado");

      const targetProfile = await getProfile(uid);
      const current = targetProfile?.badges || [];

      if (current.some(b => b.key === badge.key)) {
        alert("La insignia ya existe");
        return;
      }

      await updateProfile(uid, {
        badges: [...current, badge]
      });

      localStorage.setItem("badgesUpdated", "1");
      alert(`Insignia "${badge.name}" asignada ✔`);
    };

  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    alert("Error en dashboard. Revisá la consola.");
  }
});
