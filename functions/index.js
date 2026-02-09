const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const { client_id, client_secret, bot_token, guild_id } = functions.config().discord;

exports.discordLogin = functions.https.onRequest((req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).send("Missing uid");

  const redirectUri = `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/discordCallback`;

  const url =
    `https://discord.com/oauth2/authorize` +
    `?client_id=${client_id}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=identify%20guilds.join` +
    `&state=${uid}`;

  res.redirect(url);
});

exports.discordCallback = functions.https.onRequest(async (req, res) => {
  try {
    const code = req.query.code;
    const uid = req.query.state;
    if (!code || !uid) return res.status(400).send("Missing params");

    const redirectUri = `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/discordCallback`;

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id,
        client_secret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(400).send("No token");

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const user = await userRes.json();

    await fetch(`https://discord.com/api/guilds/${guild_id}/members/${user.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${bot_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ access_token: tokenData.access_token })
    });

    await admin.firestore().doc(`profiles/${uid}`).update({
      discord: {
        connected: true,
        id: user.id,
        username: `${user.username}${user.discriminator && user.discriminator !== "0" ? "#" + user.discriminator : ""}`,
        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });

    res.redirect("https://kodestudios.github.io/luckly/dashboard.html");
  } catch (e) {
    res.status(500).send("Discord auth error");
  }
});
