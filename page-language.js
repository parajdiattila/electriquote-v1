function initPageLanguage() {
  if (document.querySelector("#pageLanguageSelect")) return;

  const select = document.createElement("select");
  select.id = "pageLanguageSelect";
  select.className = "page-language-select";
  select.setAttribute("aria-label", "Nyelv / Limbă / Language");
  select.innerHTML = '<option value="hu">Magyar</option><option value="ro">Română</option><option value="en">English</option>';
  select.value = localStorage.getItem("villany-arajanlat-lang") || "hu";
  select.addEventListener("change", () => {
    localStorage.setItem("villany-arajanlat-lang", select.value);
    document.documentElement.lang = select.value;
    window.dispatchEvent(new CustomEvent("app-language-change", { detail: { lang: select.value } }));
  });

  const brand = document.querySelector(".brand");
  const existingHeader = document.querySelector("main > header");
  if (existingHeader) {
    existingHeader.append(select);
  } else if (brand?.parentElement) {
    const pageHeader = document.createElement("div");
    pageHeader.className = "page-language-header";
    brand.replaceWith(pageHeader);
    pageHeader.append(brand, select);
  }

  document.documentElement.lang = select.value;
  window.dispatchEvent(new CustomEvent("app-language-change", { detail: { lang: select.value } }));

  const style = document.createElement("style");
  style.textContent = `.page-language-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 18px 4px}.page-language-select{min-height:38px;padding:0 10px;border:1px solid #c8d8e8;border-radius:10px;background:#ffffffcc;color:#27425e;font:inherit;font-weight:750;cursor:pointer}.page-language-header .brand{margin:0}@media(max-width:520px){.page-language-header{margin-left:0}}`;
  document.head.append(style);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPageLanguage, { once: true });
else initPageLanguage();
