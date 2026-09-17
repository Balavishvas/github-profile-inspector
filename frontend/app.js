/**
 * GitHub Profile Inspector - Frontend Engine
 */

// Official GitHub Language Colors
const GITHUB_LANG_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Shell: "#89e051",
  "Jupyter Notebook": "#DA5B0B",
  R: "#198CE7",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Lua: "#000080",
  Default: "#64748b",
};

// Application State
const state = {
  currentUser: null,
  profileData: null,
  reposData: [],
  metrics: null,
  cliSummary: "",
  activeTab: "reposTab",
  token: localStorage.getItem("gh_pat") || "",
  recentSearches: JSON.parse(localStorage.getItem("gh_recents") || "[]"),
};

// DOM Elements
const searchForm = document.getElementById("searchForm");
const usernameInput = document.getElementById("usernameInput");
const tokenToggleBtn = document.getElementById("tokenToggleBtn");
const tokenStatusText = document.getElementById("tokenStatusText");
const tokenModal = document.getElementById("tokenModal");
const closeTokenModal = document.getElementById("closeTokenModal");
const patInput = document.getElementById("patInput");
const saveTokenBtn = document.getElementById("saveTokenBtn");
const clearTokenBtn = document.getElementById("clearTokenBtn");

const alertBox = document.getElementById("alertBox");
const alertTitle = document.getElementById("alertTitle");
const alertMessage = document.getElementById("alertMessage");
const alertClose = document.getElementById("alertClose");

const loadingIndicator = document.getElementById("loadingIndicator");
const welcomeHero = document.getElementById("welcomeHero");
const resultsDashboard = document.getElementById("resultsDashboard");

// Profile Elements
const userAvatar = document.getElementById("userAvatar");
const hireableBadge = document.getElementById("hireableBadge");
const userName = document.getElementById("userName");
const userLogin = document.getElementById("userLogin");
const developerArchetype = document.getElementById("developerArchetype");
const userHtmlUrl = document.getElementById("userHtmlUrl");
const userBio = document.getElementById("userBio");
const valLocation = document.getElementById("valLocation");
const valCompany = document.getElementById("valCompany");
const valBlog = document.getElementById("valBlog");
const valJoined = document.getElementById("valJoined");

const metaLocation = document.getElementById("metaLocation");
const metaCompany = document.getElementById("metaCompany");
const metaBlog = document.getElementById("metaBlog");
const metaJoined = document.getElementById("metaJoined");

// Metrics Counters
const statRepos = document.getElementById("statRepos");
const statFollowers = document.getElementById("statFollowers");
const statFollowing = document.getElementById("statFollowing");
const statStars = document.getElementById("statStars");
const statForks = document.getElementById("statForks");

// Languages
const languageCount = document.getElementById("languageCount");
const languageBar = document.getElementById("languageBar");
const languageList = document.getElementById("languageList");

// Tabs & Repos
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const repoCountTab = document.getElementById("repoCountTab");
const repoSearchInput = document.getElementById("repoSearchInput");
const repoSortSelect = document.getElementById("repoSortSelect");
const reposGrid = document.getElementById("reposGrid");
const noReposFound = document.getElementById("noReposFound");

const terminalOutput = document.getElementById("terminalOutput");
const jsonOutput = document.getElementById("jsonOutput");

const copyProfileBtn = document.getElementById("copyProfileBtn");
const copyTerminalBtn = document.getElementById("copyTerminalBtn");
const copyJsonBtn = document.getElementById("copyJsonBtn");
const toast = document.getElementById("toast");

const recentContainer = document.getElementById("recentContainer");
const recentList = document.getElementById("recentList");
const quickChips = document.querySelectorAll(".quick-chip");

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  updateTokenUI();
  renderRecentSearches();
  setupEventListeners();
  checkBackendHealth();

  // Check URL params for auto-search (?u=username)
  const urlParams = new URLSearchParams(window.location.search);
  const userParam = urlParams.get("u") || urlParams.get("username");
  if (userParam) {
    usernameInput.value = userParam;
    inspectUser(userParam);
  }
});

// Event Listeners
function setupEventListeners() {
  // Search Form
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = usernameInput.value.trim();
    if (query) inspectUser(query);
  });

  // Global Keyboard Shortcut: '/' to focus search
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== usernameInput && document.activeElement !== patInput && document.activeElement !== repoSearchInput) {
      e.preventDefault();
      usernameInput.focus();
      usernameInput.select();
    }
  });

  // Quick preset chips
  quickChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const user = chip.dataset.user;
      usernameInput.value = user;
      inspectUser(user);
    });
  });

  // Token Modal
  tokenToggleBtn.addEventListener("click", () => {
    patInput.value = state.token;
    tokenModal.classList.remove("hidden");
  });

  closeTokenModal.addEventListener("click", () => {
    tokenModal.classList.add("hidden");
  });

  tokenModal.addEventListener("click", (e) => {
    if (e.target === tokenModal) tokenModal.classList.add("hidden");
  });

  saveTokenBtn.addEventListener("click", () => {
    const val = patInput.value.trim();
    state.token = val;
    if (val) {
      localStorage.setItem("gh_pat", val);
      showToast("Personal Access Token saved!");
    } else {
      localStorage.removeItem("gh_pat");
      showToast("Token cleared.");
    }
    updateTokenUI();
    tokenModal.classList.add("hidden");
  });

  clearTokenBtn.addEventListener("click", () => {
    state.token = "";
    localStorage.removeItem("gh_pat");
    patInput.value = "";
    updateTokenUI();
    showToast("Token cleared.");
    tokenModal.classList.add("hidden");
  });

  // Alert Close
  alertClose.addEventListener("click", () => {
    alertBox.classList.add("hidden");
  });

  // Tabs Switching
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.dataset.tab;
      document.getElementById(targetId).classList.add("active");
      state.activeTab = targetId;
    });
  });

  // Repo filtering and sorting
  repoSearchInput.addEventListener("input", renderRepos);
  repoSortSelect.addEventListener("change", renderRepos);

  // Copy Buttons
  copyProfileBtn.addEventListener("click", () => {
    if (!state.profileData) return;
    const url = state.profileData.html_url;
    navigator.clipboard.writeText(url).then(() => showToast("Profile URL copied to clipboard!"));
  });

  copyTerminalBtn.addEventListener("click", () => {
    if (!state.cliSummary) return;
    navigator.clipboard.writeText(state.cliSummary).then(() => showToast("CLI output copied to clipboard!"));
  });

  copyJsonBtn.addEventListener("click", () => {
    if (!state.profileData) return;
    const payload = JSON.stringify({ profile: state.profileData, repos: state.reposData, metrics: state.metrics }, null, 2);
    navigator.clipboard.writeText(payload).then(() => showToast("JSON payload copied to clipboard!"));
  });
}

function updateTokenUI() {
  if (state.token) {
    tokenStatusText.textContent = "Rate Limit: Authenticated (5,000/h)";
    tokenToggleBtn.style.borderColor = "rgba(16, 185, 129, 0.4)";
    tokenToggleBtn.style.color = "var(--emerald-400)";
  } else {
    tokenStatusText.textContent = "Rate Limit: Public (60/h)";
    tokenToggleBtn.style.borderColor = "var(--border-subtle)";
    tokenToggleBtn.style.color = "var(--text-secondary)";
  }
}

// Health Check for Backend
async function checkBackendHealth() {
  try {
    const res = await fetch("/api/health");
    if (res.ok) {
      const data = await res.json();
      const statusEl = document.getElementById("backendStatus");
      if (statusEl) statusEl.textContent = "Python Backend & .venv Active";
    }
  } catch {
    // If not running under server.py (e.g. standalone file), app works in client-fetch mode
    const statusEl = document.getElementById("backendStatus");
    if (statusEl) statusEl.textContent = "Standalone Mode (Direct GitHub API)";
  }
}

// Main Inspection Pipeline
async function inspectUser(username) {
  hideAlert();
  loadingIndicator.classList.remove("hidden");
  welcomeHero.classList.add("hidden");
  resultsDashboard.classList.add("hidden");

  try {
    let data;
    // Attempt 1: Fetch via local backend API
    try {
      let endpoint = `/api/inspect?username=${encodeURIComponent(username)}`;
      if (state.token) endpoint += `&token=${encodeURIComponent(state.token)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        data = await res.json();
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server HTTP ${res.status}`);
      }
    } catch (backendErr) {
      // Fallback: direct browser fetch to GitHub REST API
      console.warn("Backend API not reachable or failed, falling back to direct GitHub fetch:", backendErr.message);
      data = await fetchDirectFromGitHub(username);
    }

    state.currentUser = username;
    state.profileData = data.profile;
    state.reposData = data.repos || [];
    state.metrics = data.metrics || calculateMetrics(data.repos || []);
    state.cliSummary = data.cli_summary || formatCliSummary(data.profile, state.metrics);

    renderProfile();
    addRecentSearch(username);

    resultsDashboard.classList.remove("hidden");
  } catch (err) {
    showError(err.message);
    welcomeHero.classList.remove("hidden");
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// Direct GitHub API Fallback
async function fetchDirectFromGitHub(username) {
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (state.token) headers["Authorization"] = `token ${state.token}`;

  const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  if (userRes.status === 404) throw new Error("GitHub user not found (404)");
  if (userRes.status === 403) throw new Error("GitHub rate limit exceeded (403). Set a Personal Access Token in the top-right.");
  if (!userRes.ok) throw new Error(`GitHub API returned status ${userRes.status}`);

  const profile = await userRes.json();

  let repos = [];
  try {
    const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=30&sort=pushed`, { headers });
    if (reposRes.ok) repos = await reposRes.json();
  } catch (e) {
    console.warn("Could not fetch user repos:", e);
  }

  const metrics = calculateMetrics(repos);
  return {
    profile,
    repos,
    metrics,
    cli_summary: formatCliSummary(profile, metrics),
  };
}

function calculateMetrics(repos) {
  let totalStars = 0;
  let totalForks = 0;
  const languages = {};

  repos.forEach((r) => {
    totalStars += r.stargazers_count || 0;
    totalForks += r.forks_count || 0;
    if (r.language) {
      languages[r.language] = (languages[r.language] || 0) + 1;
    }
  });

  return { total_stars: totalStars, total_forks: totalForks, languages };
}

function formatCliSummary(profile, metrics) {
  const lines = [
    `\nGitHub Profile: @${profile.login}`,
    "-".repeat(34),
    `Name        : ${profile.name || "Not provided"}`,
    `Public repos: ${profile.public_repos || 0}`,
    `Followers   : ${profile.followers || 0}`,
    `Following   : ${profile.following || 0}`,
    `Profile     : ${profile.html_url}`,
    `Bio         : ${profile.bio || "Not provided"}`,
  ];
  if (metrics) {
    lines.push(`Total Stars : ${metrics.total_stars || 0} (from top repos)`);
    const topLangs = Object.keys(metrics.languages || {}).slice(0, 4);
    if (topLangs.length > 0) lines.push(`Top Langs   : ${topLangs.join(", ")}`);
  }
  return lines.join("\n");
}

// Render Profile to UI
function renderProfile() {
  const p = state.profileData;
  const m = state.metrics;

  // Header card
  userAvatar.src = p.avatar_url;
  userAvatar.alt = `${p.login}'s Avatar`;

  if (p.hireable) {
    hireableBadge.classList.remove("hidden");
  } else {
    hireableBadge.classList.add("hidden");
  }

  userName.textContent = p.name || p.login;
  userLogin.textContent = `@${p.login}`;
  userHtmlUrl.href = p.html_url;

  userBio.textContent = p.bio || "No developer bio provided.";

  // Developer archetype classification
  developerArchetype.textContent = getDeveloperArchetype(p, m);

  // Metadata
  setMetaField(metaLocation, valLocation, p.location);
  setMetaField(metaCompany, valCompany, p.company);

  if (p.blog) {
    metaBlog.classList.remove("hidden");
    valBlog.textContent = p.blog.replace(/^https?:\/\//, "").replace(/\/$/, "");
    valBlog.href = p.blog.startsWith("http") ? p.blog : `https://${p.blog}`;
  } else {
    metaBlog.classList.add("hidden");
  }

  if (p.created_at) {
    metaJoined.classList.remove("hidden");
    const date = new Date(p.created_at);
    valJoined.textContent = `Joined ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  } else {
    metaJoined.classList.add("hidden");
  }

  // Counters
  animateCounter(statRepos, p.public_repos || 0);
  animateCounter(statFollowers, p.followers || 0);
  animateCounter(statFollowing, p.following || 0);
  animateCounter(statStars, m.total_stars || 0);
  animateCounter(statForks, m.total_forks || 0);

  // Languages Section
  renderLanguages(m.languages || {});

  // Repositories Section
  repoCountTab.textContent = state.reposData.length;
  renderRepos();

  // Terminal & JSON Views
  terminalOutput.textContent = state.cliSummary;
  jsonOutput.textContent = JSON.stringify({ profile: p, metrics: m, repos: state.reposData }, null, 2);
}

function setMetaField(container, textEl, value) {
  if (value && value.trim()) {
    container.classList.remove("hidden");
    textEl.textContent = value.trim();
  } else {
    container.classList.add("hidden");
  }
}

function getDeveloperArchetype(profile, metrics) {
  const followers = profile.followers || 0;
  const stars = metrics.total_stars || 0;
  const repos = profile.public_repos || 0;
  const langCount = Object.keys(metrics.languages || {}).length;

  if (followers > 5000 || stars > 2000) return "🌟 Open Source Legend";
  if (stars > 250) return "⚡ Star Magnet";
  if (langCount >= 4) return "🧩 Polyglot Hacker";
  if (repos > 40) return "🚀 Prolific Creator";
  if (followers > 100) return "🎯 Community Builder";
  return "💻 Active Builder";
}

// Languages Multi-bar & Badges
function renderLanguages(langMap) {
  const entries = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, count]) => acc + count, 0);

  languageBar.innerHTML = "";
  languageList.innerHTML = "";

  if (entries.length === 0) {
    languageCount.textContent = "No repositories detected";
    return;
  }

  languageCount.textContent = `${entries.length} language${entries.length > 1 ? "s" : ""} across top repos`;

  entries.forEach(([lang, count]) => {
    const percent = ((count / total) * 100).toFixed(1);
    const color = GITHUB_LANG_COLORS[lang] || GITHUB_LANG_COLORS.Default;

    // Segment in bar
    const segment = document.createElement("div");
    segment.className = "language-segment";
    segment.style.width = `${percent}%`;
    segment.style.backgroundColor = color;
    segment.title = `${lang}: ${percent}% (${count} repos)`;
    languageBar.appendChild(segment);

    // Badge pill
    const badge = document.createElement("div");
    badge.className = "language-badge";
    badge.innerHTML = `
      <span class="badge-dot" style="background-color: ${color}"></span>
      <span class="badge-name">${escapeHTML(lang)}</span>
      <span class="badge-percent">${percent}%</span>
    `;
    languageList.appendChild(badge);
  });
}

// Repositories Rendering with Filter and Sort
function renderRepos() {
  const query = (repoSearchInput.value || "").toLowerCase().trim();
  const sortBy = repoSortSelect.value;

  let filtered = [...state.reposData];

  if (query) {
    filtered = filtered.filter(
      (r) => (r.name && r.name.toLowerCase().includes(query)) || (r.description && r.description.toLowerCase().includes(query))
    );
  }

  // Sort
  if (sortBy === "stars") {
    filtered.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  } else if (sortBy === "forks") {
    filtered.sort((a, b) => (b.forks_count || 0) - (a.forks_count || 0));
  } else if (sortBy === "updated") {
    filtered.sort((a, b) => new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0));
  } else if (sortBy === "name") {
    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  reposGrid.innerHTML = "";

  if (filtered.length === 0) {
    noReposFound.classList.remove("hidden");
    return;
  }

  noReposFound.classList.add("hidden");

  filtered.forEach((repo) => {
    const card = document.createElement("div");
    card.className = "repo-card";

    const langColor = GITHUB_LANG_COLORS[repo.language] || GITHUB_LANG_COLORS.Default;
    const updatedDate = repo.pushed_at ? new Date(repo.pushed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

    card.innerHTML = `
      <div>
        <div class="repo-header">
          <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-link">
            ${escapeHTML(repo.name)}
          </a>
          <span class="repo-badge">${repo.visibility || (repo.private ? "Private" : "Public")}</span>
        </div>
        <p class="repo-desc">${repo.description ? escapeHTML(repo.description) : "No description provided."}</p>
      </div>

      <div class="repo-footer">
        <div class="repo-lang">
          ${repo.language ? `<span class="badge-dot" style="background-color: ${langColor}"></span><span>${escapeHTML(repo.language)}</span>` : "<span>Text</span>"}
        </div>
        <div class="repo-stats">
          <span class="repo-stat-item" title="Stars">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ${repo.stargazers_count || 0}
          </span>
          <span class="repo-stat-item" title="Forks">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="18" r="3"></circle>
              <circle cx="6" cy="6" r="3"></circle>
              <circle cx="18" cy="6" r="3"></circle>
              <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
              <path d="M12 12v3"></path>
            </svg>
            ${repo.forks_count || 0}
          </span>
          ${updatedDate ? `<span title="Last active">${updatedDate}</span>` : ""}
        </div>
      </div>
    `;

    reposGrid.appendChild(card);
  });
}

// Recent Searches Storage
function addRecentSearch(username) {
  state.recentSearches = state.recentSearches.filter((u) => u.toLowerCase() !== username.toLowerCase());
  state.recentSearches.unshift(username);
  if (state.recentSearches.length > 5) state.recentSearches.pop();
  localStorage.setItem("gh_recents", JSON.stringify(state.recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  recentList.innerHTML = "";
  if (state.recentSearches.length === 0) {
    recentContainer.classList.add("hidden");
    return;
  }

  recentContainer.classList.remove("hidden");
  state.recentSearches.forEach((user) => {
    const chip = document.createElement("button");
    chip.className = "quick-chip";
    chip.textContent = user;
    chip.addEventListener("click", () => {
      usernameInput.value = user;
      inspectUser(user);
    });
    recentList.appendChild(chip);
  });
}

// Helpers
function showError(msg) {
  alertTitle.textContent = "Inspection Failed";
  alertMessage.textContent = msg || "An unexpected error occurred.";
  alertBox.classList.remove("hidden");
}

function hideAlert() {
  alertBox.classList.add("hidden");
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2600);
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function animateCounter(element, target) {
  const duration = 750;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out expo
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const currentVal = Math.floor(start + (target - start) * easeProgress);

    element.textContent = currentVal.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else element.textContent = target.toLocaleString();
  }

  requestAnimationFrame(update);
}
