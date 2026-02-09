export const $ = (id) => document.getElementById(id);

export function slugify(str){
  return (str||"")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "");
}

export async function copyText(text){
  await navigator.clipboard.writeText(text);
}
