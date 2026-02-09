export function discordConnect(){
  const clientId = "1470166797708955758";

  const redirect = encodeURIComponent(
    "https://kodestudios.github.io/luckly/discord-callback.html"
  );

  location.href =
    `https://discord.com/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&response_type=token` +
    `&redirect_uri=${redirect}` +
    `&scope=identify`;
}

