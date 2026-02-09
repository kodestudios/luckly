export function getSlugFromPath(){
  const parts = location.pathname.split("/").filter(Boolean); // ["luckly","juan"]
  return (parts[1] || "").toLowerCase();
}
