
let API_URL = "";
let apiReady = false;
let API_FALLBACK_URL = "";
let apiTimeoutMs = 10000;

function setBackendStatus(state, text) {
  const badge = document.getElementById("backendStatus");
  const label = document.getElementById("backendStatusText");
  if (!badge || !label) return;

  badge.classList.remove("is-checking", "is-online", "is-offline");
  if (state === "online") badge.classList.add("is-online");
  else if (state === "offline") badge.classList.add("is-offline");
  else badge.classList.add("is-checking");

  label.textContent = text || "Checking";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = apiTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function probeBackend(baseUrl, healthEndpoint) {
  try {
    const r = await fetchWithTimeout(`${baseUrl}${healthEndpoint}`, {
      method: "GET",
    });
    if (r.ok) return true;
  } catch {
    // fallback below
  }

  // Fallback probe: try one lightweight analyze call.
  try {
    const probeResponse = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "ping" }),
    });
    if (probeResponse.ok) return true;

    if (
      (probeResponse.status === 404 || probeResponse.status === 405) &&
      API_FALLBACK_URL &&
      API_FALLBACK_URL !== API_URL
    ) {
      const fallbackProbe = await fetchWithTimeout(API_FALLBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "ping" }),
      });
      return fallbackProbe.ok;
    }
  } catch {
    return false;
  }

  return false;
}

// ==============================
// Load app.json configuration
// ==============================
fetch("app.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Failed to load app.json");
    }
    return response.json();
  })
  .then((config) => {
    const baseUrl = (config?.api?.base_url || "").replace(/\/+$/, "");
    const endpoint =
      config?.api?.endpoints?.analyze ||
      config?.api?.endpoints?.safety_check ||
      "/safety-check";
    const fallbackEndpoint =
      config?.api?.endpoints?.safety_check || "/safety-check";
    const healthEndpoint = config?.api?.endpoints?.health || "/health";
    apiTimeoutMs = Number(config?.api?.timeout_ms) || 10000;

    API_URL = `${baseUrl}${endpoint}`;
    API_FALLBACK_URL = `${baseUrl}${fallbackEndpoint}`;
    apiReady = true;
    console.log("✅ API configured:", API_URL);

    // Probe backend so user sees helpful message early.
    probeBackend(baseUrl, healthEndpoint).then((ok) => {
      if (ok) {
        setBackendStatus("online", "Online");
        showSystemMessage("Connected. Add text or use the mic, then send.");
      } else {
        setBackendStatus("offline", "Offline");
        showSystemMessage("Server error. Reload app or restart API.");
      }
    });
  })
  .catch((error) => {
    console.error("❌ Config load error:", error);
    showSystemMessage("Config error. Check connection.");
  });

function crisisResourcesHtml(status) {
  const H = window.UPEO_HELPLINES;
  if (!H) return "";

  const st = String(status || "").toLowerCase();
  const showNational = st === "harmful" || st === "warning";
  if (!showNational) return "";

  return `<div class="upeo-crisis-inline">
      <div class="upeo-crisis-inline-block">
        <h4 class="upeo-crisis-inline-title"><i class="fas fa-life-ring" aria-hidden="true"></i> Kenya · talk to someone</h4>
        <ul class="upeo-crisis-inline-nums">
          <li><a href="tel:1195"><strong>1195</strong></a> GBV</li>
          <li><a href="tel:999"><strong>999</strong></a> / <a href="tel:112"><strong>112</strong></a> emergency</li>
          <li><a href="tel:116"><strong>116</strong></a> Childline</li>
        </ul>
        <button type="button" class="upeo-linkish-btn" data-open-helplines="1">All counties + USIU</button>
      </div>
    </div>`;
}

// ==============================
// Send message to backend
// ==============================
async function sendMessage() {
  if (!apiReady || !API_URL) {
    showSystemMessage("Starting… try again in a moment.");
    return;
  }

  const input = document.getElementById("textInput");
  const text = input.value.trim();

  if (!text) return;

  addMessage(text, "user-msg");
  input.value = "";

  showTyping();

  try {
    setBackendStatus("checking", "Checking");
    let response = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });

    // Auto-fallback to legacy endpoint if analyze route is missing.
    if (
      (response.status === 404 || response.status === 405) &&
      API_FALLBACK_URL &&
      API_FALLBACK_URL !== API_URL
    ) {
      response = await fetchWithTimeout(API_FALLBACK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });
    }

    removeTyping();

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    setBackendStatus("online", "Online");
    showAlert(data);
  } catch (error) {
    console.error("❌ API error:", error);
    removeTyping();
    setBackendStatus("offline", "Offline");
    showSystemMessage("Server error. Reload app or restart API.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    if (localStorage.getItem("upeo_calm_ui") === "1") {
      document.documentElement.classList.add("upeo-calmer");
    } else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("upeo-calmer");
    }
  } catch {
    /* ignore */
  }

  const input = document.getElementById("textInput");
  const sendBtn = document.getElementById("sendBtn");
  if (!input || !sendBtn) return;
  setBackendStatus("checking", "Checking");

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
  sendBtn.addEventListener("click", () => sendMessage());

  initHelplinesModal();
  initVoiceInput(input);
  initCrisisDelegation();
});

function initCrisisDelegation() {
  document.getElementById("messages")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-helplines]")) {
      openHelplinesModal();
    }
  });
}

function initHelplinesModal() {
  const H = window.UPEO_HELPLINES;
  const modal = document.getElementById("helplinesModal");
  const backdrop = document.getElementById("helplinesBackdrop");
  const closeBtn = document.getElementById("closeHelplinesBtn");
  const openBtn = document.getElementById("openHelplinesBtn");
  const disc = document.getElementById("helplinesDisclaimer");
  const nationalEl = document.getElementById("helplinesNational");
  const countySelect = document.getElementById("countySelect");
  const countyDetail = document.getElementById("countyDetail");
  const usiuStatic = document.getElementById("helplinesUsiuStatic");

  if (!H || !modal || !countySelect || !countyDetail) return;

  if (disc) disc.textContent = H.disclaimer;

  if (nationalEl) {
    nationalEl.innerHTML = H.national
      .map(
        (item) => `
      <article class="upeo-helpline-card">
        <h3>${escapeHtml(item.label)}</h3>
        <p class="upeo-helpline-nums">${item.numbers
          .map((n) => `<a href="tel:${String(n).replace(/\s/g, "")}">${escapeHtml(n)}</a>`)
          .join(" · ")}</p>
        <p class="upeo-helpline-meta">${escapeHtml(item.hours)}</p>
        <p>${escapeHtml(item.note)}</p>
      </article>`
      )
      .join("");
  }

  countySelect.innerHTML = H.counties
    .map((c, i) => `<option value="${i}">${escapeHtml(c.name)} County</option>`)
    .join("");

  function renderCounty() {
    const idx = parseInt(countySelect.value, 10);
    const c = H.counties[idx];
    if (!c) return;
    countyDetail.innerHTML = `
      <p><strong>${escapeHtml(c.name)}</strong> · Call <a href="tel:1195">1195</a> for local referral. Emergency: <a href="tel:999">999</a> / <a href="tel:112">112</a>.</p>
    `;
  }

  countySelect.addEventListener("change", renderCounty);
  renderCounty();

  if (usiuStatic && H.usiu) {
    const u = H.usiu;
    usiuStatic.innerHTML = `
      <h3 class="upeo-helplines-subhd">${escapeHtml(u.title)}</h3>
      <p>${escapeHtml(u.subtitle)}</p>
      <ul>${u.promises.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
      ${u.lines
        .map(
          (block) =>
            `<p><strong>${escapeHtml(block.label)}</strong><br>${block.numbers
              .map((n) => `<a href="tel:${String(n).replace(/\s/g, "")}">${escapeHtml(n)}</a>`)
              .join(" · ")}</p>`
        )
        .join("")}
      <p><a href="${escapeHtml(u.web.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.web.label)}</a></p>
    `;
  }

  function close() {
    modal.hidden = true;
    modal.classList.remove("is-open");
    document.body.classList.remove("upeo-modal-open");
  }

  function open() {
    modal.hidden = false;
    modal.classList.add("is-open");
    document.body.classList.add("upeo-modal-open");
    closeBtn?.focus();
  }

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  window.openHelplinesModal = open;
}

function initVoiceInput(input) {
  const voiceBtn = document.getElementById("voiceBtn");
  const statusEl = document.getElementById("voiceStatus");
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!voiceBtn) return;

  if (!SR) {
    voiceBtn.disabled = true;
    voiceBtn.title = "Voice needs Chrome or Edge";
    if (statusEl) statusEl.textContent = "Voice unavailable—type instead.";
    return;
  }

  const recognition = new SR();
  recognition.lang = "en-KE";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let listening = false;

  function setListening(on) {
    listening = on;
    voiceBtn.classList.toggle("is-listening", on);
    voiceBtn.setAttribute("aria-pressed", on ? "true" : "false");
    if (statusEl) statusEl.textContent = on ? "Listening…" : "";
  }

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript.trim();
    setListening(false);
  };

  recognition.onerror = (event) => {
    setListening(false);
    const msg =
      event.error === "not-allowed"
        ? "Mic blocked—allow in browser settings."
        : event.error === "no-speech"
          ? "No speech detected."
          : `Voice: ${event.error}`;
    if (statusEl) statusEl.textContent = msg;
  };

  recognition.onend = () => {
    if (listening) setListening(false);
  };

  voiceBtn.addEventListener("click", () => {
    if (listening) {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      return;
    }
    try {
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      if (statusEl) statusEl.textContent = "Mic didn’t start.";
    }
  });
}

// ==============================
// UI helper functions
// ==============================
function addMessage(text, className) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${className}`;
  msgDiv.textContent = text;

  const messages = document.getElementById("messages");
  messages.appendChild(msgDiv);
  messages.scrollTop = messages.scrollHeight;
}

function showAlert(data) {
  const alertDiv = document.createElement("div");
  const status = data && data.status ? String(data.status).toLowerCase() : "safe";
  alertDiv.className = `message bot-msg upeo-result ${status}`;

  const label =
    status === "harmful" ? "Harmful" : status === "warning" ? "Caution" : "Looks safe";

  const steps = Array.isArray(data?.next_steps) ? data.next_steps : [];
  const list =
    steps.length > 0
      ? `<ul class="upeo-next-steps">${steps.map((s) => `<li>${escapeHtml(String(s))}</li>`).join("")}</ul>`
      : "<p class=\"upeo-next-empty\">No tips returned—use the platform’s report tools if needed.</p>";

  const crisis = crisisResourcesHtml(status);

  alertDiv.innerHTML = `
    <div class="upeo-result-head">
      <span class="upeo-result-badge ${status}">${escapeHtml(label)}</span>
    </div>
    <p class="upeo-result-actions-title">Next steps</p>
    ${list}
    ${crisis}
  `;

  const messages = document.getElementById("messages");
  messages.appendChild(alertDiv);
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showSystemMessage(text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "message bot-msg system";
  msgDiv.textContent = text;

  const messages = document.getElementById("messages");
  messages.appendChild(msgDiv);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const typing = document.createElement("div");
  typing.id = "typing";
  typing.className = "typing";
  typing.innerHTML = `Checking<span>.</span><span>.</span><span>.</span>`;

  const messages = document.getElementById("messages");
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typing");
  if (typing) typing.remove();
}
