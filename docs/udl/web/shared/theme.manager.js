const DEFAULTS = {
  shell: "azure",
  modules: { udl:"azure", pbj:"execdash", ship:"jira", winboard:"jira" }
};
export function loadThemeConfig(){
  try{
    const raw = localStorage.getItem("udl_theme_cfg");
    if(!raw) return structuredClone(DEFAULTS);
    const cfg = JSON.parse(raw);
    return { shell: cfg.shell || DEFAULTS.shell, modules: { ...DEFAULTS.modules, ...(cfg.modules||{}) } };
  }catch(e){ return structuredClone(DEFAULTS); }
}
export function saveThemeConfig(cfg){ localStorage.setItem("udl_theme_cfg", JSON.stringify(cfg)); }
export function applyShellTheme(cfg){ document.documentElement.setAttribute("data-shell", cfg.shell || "azure"); }
export function skinFor(cfg, moduleKey){ return (cfg.modules && cfg.modules[moduleKey]) ? cfg.modules[moduleKey] : "azure"; }
