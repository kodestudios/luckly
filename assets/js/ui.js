export function setActiveTab(tabs, panels, tabName){
  tabs.forEach(b => b.classList.toggle("active", b.dataset.tab === tabName));
  panels.forEach(p => p.classList.toggle("show", p.id === `panel-${tabName}`));
}

export function escapeHtml(str){
  return (str||"").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

export function renderSocials(container, socials, onRemove){
  container.innerHTML = "";
  socials.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <div>
        <div style="font-weight:900">${escapeHtml(s.label || "Link")}</div>
        <div style="opacity:.75">${escapeHtml(s.url || "")}</div>
      </div>
      <button class="btn" data-i="${i}">Quitar</button>
    `;
    div.querySelector("button").onclick = () => onRemove(i);
    container.appendChild(div);
  });
}
