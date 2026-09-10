(() => {
  const root = new URL("../../../", document.currentScript.src);
  const active = document.body.dataset.section || "games";
  const header = document.createElement("header");
  header.className = "topbar";
  const wrap = document.createElement("div");
  wrap.className = "nav-wrap";
  const brand = document.createElement("a");
  brand.href = new URL("activities.html", root).href;
  brand.className = "brand";
  brand.innerHTML =
    '<span class="brand-mark" lang="bo">ཀ</span><span>Tibetan Learning</span>';
  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.setAttribute("aria-label", "Main navigation");
  for (const [id, label, path] of [
    ["learn", "Learn", "learn.html"],
    ["games", "Games", "activities.html#games"],
  ]) {
    const link = document.createElement("a");
    link.href = new URL(path, root).href;
    link.textContent = label;
    if (id === active) link.setAttribute("aria-current", "page");
    nav.append(link);
  }
  wrap.append(brand, nav);
  header.append(wrap);
  document.body.prepend(header);
  const skip = document.createElement("a");
  skip.className = "skip";
  skip.href = "#main";
  skip.textContent = "Skip to content";
  document.body.prepend(skip);
})();
