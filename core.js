(function () {

const SECRET = "NEXGEN_SUPER_SECRET_2026";
const DB_URL = "https://cdn.jsdelivr.net/ghdhan-singh-developer/web-assets-v2/db.json";
const CACHE_KEY = "_ngp_cache_v3";

function sha256(str) {
  const enc = new TextEncoder().encode(str);
  return crypto.subtle.digest("SHA-256", enc).then(buf =>
    Array.from(new Uint8Array(buf))
      .map(x => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

function domain() {
  return location.hostname.replace(/^www\./, "").toLowerCase();
}

function blockScreen(msg) {
  document.documentElement.innerHTML =
    "<h1 style='font-family:sans-serif;text-align:center;margin-top:20%'>" +
    msg +
    "</h1>";
}

async function fetchDB() {
  try {
    const r = await fetch(DB_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function verify(db) {
  if (!db) return { ok: false, reason: "NO_DB" };

  if (db.kill === 1) return { ok: false, reason: "KILL_SWITCH" };

  const d = domain();
  const hash = await sha256(d + SECRET);

  if (db.blocked.includes(hash))
    return { ok: false, reason: "BLOCKED" };

  const lic = db.licenses.find(x => x.h === hash);

  if (!lic) return { ok: false, reason: "NO_LICENSE" };

  if (!lic.active) return { ok: false, reason: "INACTIVE" };

  if (lic.exp !== 0 && Date.now() > lic.exp)
    return { ok: false, reason: "EXPIRED" };

  return { ok: true, lic };
}

function unlockTemplate() {
  document.documentElement.style.display = "block";
}

function lockTemplate() {
  document.documentElement.style.display = "none";
}

async function init() {

  lockTemplate();

  const db = await fetchDB();

  const result = await verify(db);

  if (!result.ok) {
    blockScreen("License Error: " + result.reason);
    return;
  }

  unlockTemplate();

}

init();

})();
