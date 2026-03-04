export function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);

  // attrs can be omitted; allow el("div", [child...])
  if (Array.isArray(attrs) || attrs instanceof Node || typeof attrs === "string") {
    children = attrs;
    attrs = {};
  }

  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, v);
  }

  // Normalize children to an array
  let list = [];
  if (children == null) list = [];
  else if (Array.isArray(children)) list = children;
  else if (children instanceof Node) list = [children];
  else if (typeof children === "string" || typeof children === "number" || typeof children === "boolean") list = [String(children)];
  else if (typeof children[Symbol.iterator] === "function") list = Array.from(children);
  else list = [String(children)];

  for (const c of list) {
    if (c == null) continue;
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return n;
}

export function uid(prefix="id"){ return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`; }
export function clamp(n,a,b){ return Math.max(a, Math.min(b,n)); }
