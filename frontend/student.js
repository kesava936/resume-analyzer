const API_URL = "http://localhost:3000/api/upload";
let selectedFile = null;

// ── Drag and drop ──────────────────────────────────────────────────────────
const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragging");

  const file = e.dataTransfer.files[0];

  if (file && file.type === "application/pdf") {
    setFile(file);
  } else {
    showError("Only PDF files are accepted.");
  }
});

// ── File selection ─────────────────────────────────────────────────────────
function handleFileSelect(input) {
  if (input.files[0]) setFile(input.files[0]);
}

function setFile(file) {
  selectedFile = file;

  const label = document.getElementById("fileName");
  label.textContent = `✓ ${file.name}`;
  label.classList.remove("hidden");

  clearError();
  hideResults();
}

// ── Upload ─────────────────────────────────────────────────────────────────
async function upload() {
  clearError();

  if (!selectedFile) {
    showError("Please select a PDF file before uploading.");
    return;
  }

  const btn = document.getElementById("uploadBtn");
  btn.textContent = "Analysing…";
  btn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("resume", selectedFile);

    const res = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    console.log("FULL API RESPONSE:", json);
    console.log("DATA:", json.data);

    if (!res.ok) {
      throw new Error(json.message || `Server error: ${res.status}`);
    }

    renderResults(json.data);

  } catch (err) {
    showError(err.message);
  } finally {
    btn.textContent = "Upload & Analyse";
    btn.disabled = false;
  }
}

// ── Render results ─────────────────────────────────────────────────────────
function renderResults(data) {
  const score     = data.score     ?? 0;
  const decision  = data.decision  ?? null;
  const breakdown = data.breakdown ?? null;

  const skills = Array.isArray(data.skills)
    ? data.skills
    : typeof data.skills === "string" && data.skills
      ? data.skills.split(",").map(s => s.trim())
      : [];

  // Score display
  document.getElementById("scoreValue").textContent = score;

  const bar = document.getElementById("scoreBar");
  bar.style.width = "0%";
  bar.className = `h-full rounded-full transition-all duration-700 ${scoreColor(score)}`;
  requestAnimationFrame(() => setTimeout(() => { bar.style.width = `${score}%`; }, 50));

  const scoreBarContainer = bar.closest(".mt-3");

  // ── Top Candidate badge ─────────────────────────────────────────────────
  const existingTopBadge = document.getElementById("topCandidateBadge");
  if (existingTopBadge) existingTopBadge.remove();

  if (score >= 80) {
    const topBadge = document.createElement("div");
    topBadge.id        = "topCandidateBadge";
    topBadge.className = "mt-3 inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    topBadge.textContent = "⭐ Top Candidate";
    scoreBarContainer.after(topBadge);
  }

  // ── Decision badge ──────────────────────────────────────────────────────
  const existingBadge = document.getElementById("decisionBadge");
  if (existingBadge) existingBadge.remove();

  if (decision !== null && decision !== undefined) {
    const badgeColors = {
      "Move Forward":        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      "Borderline":          "bg-amber-500/10   text-amber-400   border-amber-500/30",
      "Do Not Move Forward": "bg-red-500/10     text-red-400     border-red-500/30",
    };

    const badgeClass = badgeColors[decision] || "bg-zinc-800 text-zinc-400 border-zinc-700";

    const badge = document.createElement("div");
    badge.id        = "decisionBadge";
    badge.className = `mt-2 inline-block text-xs font-mono px-3 py-1 rounded-full border ${badgeClass}`;
    badge.textContent = decision;

    const anchor = document.getElementById("topCandidateBadge") || scoreBarContainer;
    anchor.after(badge);
  }

  // ── Skills ──────────────────────────────────────────────────────────────
  const list     = document.getElementById("skillsList");
  const noSkills = document.getElementById("noSkills");
  list.innerHTML  = "";

  if (skills.length === 0) {
    noSkills.classList.remove("hidden");
  } else {
    noSkills.classList.add("hidden");
    skills.forEach((skill) => {
      const li = document.createElement("li");
      li.className = "bg-zinc-800 text-emerald-400 text-xs font-mono px-3 py-1 rounded-full border border-zinc-700";
      li.textContent = skill;
      list.appendChild(li);
    });
  }

  // ── Score Breakdown ─────────────────────────────────────────────────────
  const breakdownSection = document.getElementById("breakdownSection");
  const breakdownList    = document.getElementById("breakdownList");
  breakdownList.innerHTML = "";

  const existingInsights = document.getElementById("insightsSection");
  if (existingInsights) existingInsights.remove();

  if (breakdown && typeof breakdown === "object" && Object.keys(breakdown).length > 0) {
    breakdownSection.classList.remove("hidden");

    const strongAreas = [];
    const weakAreas   = [];

    Object.entries(breakdown).forEach(([category, info]) => {
      const categoryScore = info.score ?? 0;
      const categoryCap   = info.cap   ?? 0;
      const pct           = categoryCap > 0 ? (categoryScore / categoryCap) * 100 : 0;

      const barColor = pct >= 80
        ? "bg-emerald-500"
        : pct >= 50
          ? "bg-amber-400"
          : "bg-red-500";

      const label = category.charAt(0).toUpperCase() + category.slice(1);

      if (pct >= 70) strongAreas.push(label);
      else if (pct < 40) weakAreas.push(label);

      const li = document.createElement("li");
      li.className = "flex items-center gap-3";
      li.innerHTML = `
        <span class="w-24 text-xs text-zinc-400 font-mono capitalize shrink-0">${label}</span>
        <div class="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700 ${barColor}" style="width: ${pct}%"></div>
        </div>
        <span class="text-xs font-mono text-zinc-300 shrink-0">${categoryScore} / ${categoryCap}</span>
      `;
      breakdownList.appendChild(li);
    });

    if (strongAreas.length > 0 || weakAreas.length > 0) {
      const insights = document.createElement("div");
      insights.id        = "insightsSection";
      insights.className = "mt-5 space-y-2";

      if (strongAreas.length > 0) {
        const strong = document.createElement("p");
        strong.className = "text-xs font-mono";
        strong.innerHTML = `<span class="text-emerald-400 font-bold">Strong:</span> <span class="text-zinc-300">${strongAreas.join(", ")}</span>`;
        insights.appendChild(strong);
      }

      if (weakAreas.length > 0) {
        const weak = document.createElement("p");
        weak.className = "text-xs font-mono";
        weak.innerHTML = `<span class="text-red-400 font-bold">Weak:</span> <span class="text-zinc-300">${weakAreas.join(", ")}</span>`;
        insights.appendChild(weak);
      }

      breakdownSection.appendChild(insights);
    }

  } else {
    breakdownSection.classList.add("hidden");
  }

  document.getElementById("results").classList.remove("hidden");
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── Score color helper ─────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-500";
}

// ── Helpers ────────────────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById("errorMsg");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError() {
  const el = document.getElementById("errorMsg");
  el.textContent = "";
  el.classList.add("hidden");
}

function hideResults() {
  document.getElementById("results").classList.add("hidden");
}