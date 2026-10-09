const $ = id => document.getElementById(id);

const KEYS = {
  tickets: "devtrack-tickets-v2",
  settings: "devtrack-settings-v2",
  session: "devtrack-demo-session"
};

const DEMO_EMAIL = "demo@devtrack.com";
const DEMO_PASSWORD = "DevTrack123!";

const starterTickets = [
  {
    id: 1001,
    title: "Login page validation error",
    category: "Software",
    priority: "High",
    status: "Open",
    description: "Investigate the login form validation issue.",
    created: "2026-10-05"
  },
  {
    id: 1002,
    title: "Dashboard layout improvement",
    category: "Technical",
    priority: "Medium",
    status: "In Progress",
    description: "Improve dashboard responsiveness on tablets.",
    created: "2026-10-06"
  },
  {
    id: 1003,
    title: "Update documentation",
    category: "General",
    priority: "Low",
    status: "Resolved",
    description: "Update setup instructions.",
    created: "2026-10-07"
  },
  {
    id: 1004,
    title: "API connection failure",
    category: "Network",
    priority: "Urgent",
    status: "Open",
    description: "Investigate a failing API connection.",
    created: "2026-10-08"
  }
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("Could not save. Check your browser storage settings.");
    return false;
  }
}

let tickets = readStorage(KEYS.tickets, null);
if (!Array.isArray(tickets)) {
  tickets = starterTickets.map(ticket => ({ ...ticket }));
  writeStorage(KEYS.tickets, tickets);
}

let settings = {
  name: "Demo User",
  email: DEMO_EMAIL,
  darkMode: false,
  notifications: true,
  ...readStorage(KEYS.settings, {})
};

let currentPage = "dashboard";
let editingId = null;
let toastTimer;

const dialog = $("ticketDialog");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function persistTickets() {
  return writeStorage(KEYS.tickets, tickets);
}

function applySettings() {
  document.body.classList.toggle("dark", settings.darkMode);

  $("sidebarName").textContent = settings.name;
  $("sidebarEmail").textContent = settings.email;
  $("sidebarAvatar").textContent =
    settings.name.trim().charAt(0).toUpperCase() || "D";

  $("welcomeTitle").textContent = `Welcome back, ${settings.name}!`;

  $("profileName").value = settings.name;
  $("profileEmail").value = settings.email;
  $("darkMode").checked = settings.darkMode;
  $("notifications").checked = settings.notifications;
}

function showApplication() {
  $("loginPage").classList.add("hidden");
  $("app").classList.remove("hidden");
  applySettings();
  render();
  navigate("dashboard");
}

function showLogin() {
  $("app").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
  $("loginPassword").value = "";
  $("loginError").textContent = "";
}

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    $("loginError").textContent =
      "Invalid demo credentials. Please check the demo account details.";
    return;
  }

  try {
    sessionStorage.setItem(KEYS.session, "active");
  } catch {
    // This remains a demonstration, not secure authentication.
  }

  showApplication();
  showToast("Signed in to the demo workspace.");
});

$("logoutButton").addEventListener("click", () => {
  if (!confirm("Are you sure you want to log out?")) return;

  try {
    sessionStorage.removeItem(KEYS.session);
  } catch {
    // Continue to the login screen.
  }

  showLogin();
  showToast("You have logged out.");
});

function navigate(page) {
  if (!["dashboard", "tickets", "settings"].includes(page)) return;

  currentPage = page;

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== `${page}Page`);
  });

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    dashboard: "Dashboard",
    tickets: "Ticket Management",
    settings: "Settings"
  };

  $("pageTitle").textContent = titles[page];
  $("headerAddButton").classList.toggle("hidden", page === "settings");
  $("todayDate").textContent = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  if (page === "settings") applySettings();
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.go));
});

$("headerAddButton").addEventListener("click", () => openTicketForm());
$("ticketAddButton").addEventListener("click", () => openTicketForm());

function render() {
  const counts = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "Open").length,
    progress: tickets.filter(t => t.status === "In Progress").length,
    resolved: tickets.filter(t => t.status === "Resolved").length
  };

  Object.entries(counts).forEach(([id, count]) => {
    $(id).textContent = count;
  });

  renderRecent();
  renderTickets();
  renderOverview();
}

function badge(value) {
  const safe = escapeHTML(value);
  const className = safe.replace(/\s/g, "-");
  return `<span class="badge ${className}">${safe}</span>`;
}

function ticketTitle(ticket) {
  return `
    <div class="ticket-title">${escapeHTML(ticket.title)}</div>
    <div class="ticket-id">#${escapeHTML(ticket.id)}</div>
  `;
}

function renderRecent() {
  const recent = [...tickets]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  $("recentList").innerHTML = recent.length
    ? recent.map(ticket => `
      <tr>
        <td>${ticketTitle(ticket)}</td>
        <td>${escapeHTML(ticket.category)}</td>
        <td>${badge(ticket.priority)}</td>
        <td>${badge(ticket.status)}</td>
        <td>${escapeHTML(ticket.created)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">No tickets yet. Create your first ticket.</td></tr>`;
}

function renderTickets() {
  const query = $("search").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const priority = $("priorityFilter").value;

  const filtered = tickets.filter(ticket => {
    const searchable =
      `${ticket.title} ${ticket.category} ${ticket.id} ${ticket.description}`
        .toLowerCase();

    return searchable.includes(query)
      && (status === "All" || ticket.status === status)
      && (priority === "All" || ticket.priority === priority);
  }).sort((a, b) => b.id - a.id);

  $("ticketCount").textContent =
    `Showing ${filtered.length} of ${tickets.length} tickets`;

  $("ticketList").innerHTML = filtered.length
    ? filtered.map(ticket => `
      <tr>
        <td>${ticketTitle(ticket)}</td>
        <td>${escapeHTML(ticket.category)}</td>
        <td>${badge(ticket.priority)}</td>
        <td>${badge(ticket.status)}</td>
        <td>${escapeHTML(ticket.created)}</td>
        <td>
          <div class="action-group">
            <button class="action" data-edit="${ticket.id}">Edit</button>
            <button class="action delete" data-delete="${ticket.id}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="6">No matching tickets found.</td></tr>`;
}

function renderOverview() {
  const items = [
    { label: "Open", count: tickets.filter(t => t.status === "Open").length, fill: "fill-open" },
    { label: "In Progress", count: tickets.filter(t => t.status === "In Progress").length, fill: "fill-progress" },
    { label: "Resolved", count: tickets.filter(t => t.status === "Resolved").length, fill: "fill-resolved" }
  ];

  const total = tickets.length;

  $("statusOverview").innerHTML = items.map(item => {
    const percentage = total ? Math.round(item.count / total * 100) : 0;

    return `
      <div class="overview-row">
        <span>${item.label}</span>
        <div class="progress-track">
          <div class="progress-fill ${item.fill}"
            style="width:${percentage}%"></div>
        </div>
        <strong>${item.count}</strong>
      </div>
    `;
  }).join("");
}

$("search").addEventListener("input", renderTickets);
$("statusFilter").addEventListener("change", renderTickets);
$("priorityFilter").addEventListener("change", renderTickets);

function openTicketForm(ticket = null) {
  editingId = ticket ? ticket.id : null;
  $("ticketForm").reset();

  $("ticketId").value = ticket?.id ?? "";
  $("formTitle").textContent = ticket ? "Edit Ticket" : "Create Ticket";
  $("title").value = ticket?.title ?? "";
  $("description").value = ticket?.description ?? "";
  $("category").value = ticket?.category ?? "Technical";
  $("priority").value = ticket?.priority ?? "Medium";
  $("status").value = ticket?.status ?? "Open";

  dialog.showModal();
}

function closeTicketForm() {
  dialog.close();
  editingId = null;
}

$("closeButton").addEventListener("click", closeTicketForm);
$("cancelButton").addEventListener("click", closeTicketForm);

dialog.addEventListener("click", event => {
  if (event.target === dialog) closeTicketForm();
});

$("ticketList").addEventListener("click", event => {
  const edit = event.target.closest("[data-edit]");
  const remove = event.target.closest("[data-delete]");

  if (edit) {
    const ticket = tickets.find(t => t.id === Number(edit.dataset.edit));
    if (ticket) openTicketForm(ticket);
  }

  if (remove) {
    const id = Number(remove.dataset.delete);
    const ticket = tickets.find(t => t.id === id);

    if (!ticket || !confirm(`Delete "${ticket.title}"?`)) return;

    const previous = tickets;
    tickets = tickets.filter(t => t.id !== id);

    if (persistTickets()) {
      render();
      showToast("Ticket deleted.");
    } else {
      tickets = previous;
    }
  }
});

$("ticketForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("title").value.trim();
  const description = $("description").value.trim();

  if (!title || !description) return;

  const existing = tickets.find(t => t.id === editingId);

  const ticket = {
    id: existing?.id ?? Date.now(),
    title,
    description,
    category: $("category").value,
    priority: $("priority").value,
    status: $("status").value,
    created: existing?.created ?? new Date().toISOString().slice(0, 10)
  };

  const previous = tickets;

  tickets = existing
    ? tickets.map(t => t.id === existing.id ? ticket : t)
    : [ticket, ...tickets];

  if (persistTickets()) {
    closeTicketForm();
    render();
    showToast(existing ? "Ticket updated." : "Ticket created.");
  } else {
    tickets = previous;
  }
});

$("settingsForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("profileName").value.trim();
  const email = $("profileEmail").value.trim();

  if (!name || !email) return;

  const previous = { ...settings };

  settings = {
    ...settings,
    name,
    email,
    darkMode: $("darkMode").checked,
    notifications: $("notifications").checked
  };

  if (!writeStorage(KEYS.settings, settings)) {
    settings = previous;
    return;
  }

  applySettings();
  $("settingsMessage").textContent = "Settings saved successfully.";
  showToast("Settings saved.");
});

function initialize() {
  applySettings();

  let activeSession = false;
  try {
    activeSession = sessionStorage.getItem(KEYS.session) === "active";
  } catch {
    // Storage might be disabled in the browser.
  }

  if (activeSession) {
    showApplication();
  } else {
    showLogin();
  }
}

initialize();
