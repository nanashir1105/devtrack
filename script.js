
"use strict";

const $ = id => document.getElementById(id);

const STORAGE_KEY = "devtrack_tickets_v3";
const PROFILE_KEY = "devtrack_profile_v3";
const PREF_KEY = "devtrack_preferences_v3";
const AUTH_KEY = "devtrack_demo_auth_v3";

function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString();
}

const seedTickets = [
  {id:"DT-1048",title:"Unable to reset account password",description:"Password reset link expires before the customer can use it.",requester:"Olivia Chen",email:"olivia@example.com",category:"Account",priority:"High",status:"Open",assignee:"Alex Morgan",created:daysAgo(0)},
  {id:"DT-1047",title:"Invoice total does not match subscription",description:"The monthly invoice shows an unexpected additional charge.",requester:"James Wilson",email:"james@example.com",category:"Billing",priority:"High",status:"In Progress",assignee:"Taylor Reed",created:daysAgo(0)},
  {id:"DT-1046",title:"Dashboard takes too long to load",description:"Analytics page loads slowly with larger datasets.",requester:"Sophia Patel",email:"sophia@example.com",category:"Technical",priority:"Medium",status:"In Progress",assignee:"Alex Morgan",created:daysAgo(1)},
  {id:"DT-1045",title:"Request to add CSV export",description:"Would like to export reports to CSV.",requester:"Noah Kim",email:"noah@example.com",category:"Feature Request",priority:"Low",status:"Open",assignee:"Jordan Lee",created:daysAgo(1)},
  {id:"DT-1044",title:"Two-factor authentication setup issue",description:"Verification code is not accepted during setup.",requester:"Emma Davis",email:"emma@example.com",category:"Technical",priority:"High",status:"Open",assignee:"Taylor Reed",created:daysAgo(2)},
  {id:"DT-1043",title:"Update billing contact details",description:"Customer needs to update the finance contact.",requester:"Liam Brown",email:"liam@example.com",category:"Billing",priority:"Low",status:"Resolved",assignee:"Jordan Lee",created:daysAgo(2)},
  {id:"DT-1042",title:"Team member invitation not received",description:"Invitation email does not arrive.",requester:"Ava Martinez",email:"ava@example.com",category:"Account",priority:"Medium",status:"Resolved",assignee:"Alex Morgan",created:daysAgo(3)},
  {id:"DT-1041",title:"Mobile navigation overlaps content",description:"Navigation overlaps page content on smaller screens.",requester:"Ethan Taylor",email:"ethan@example.com",category:"Technical",priority:"Medium",status:"Closed",assignee:"Taylor Reed",created:daysAgo(4)},
  {id:"DT-1040",title:"Request for additional reporting filters",description:"Filter reports by team and date range.",requester:"Mia Anderson",email:"mia@example.com",category:"Feature Request",priority:"Low",status:"Resolved",assignee:"Jordan Lee",created:daysAgo(5)},
  {id:"DT-1039",title:"Unable to change profile email",description:"The email field returns an unexpected validation message.",requester:"Lucas Garcia",email:"lucas@example.com",category:"Account",priority:"High",status:"Closed",assignee:"Alex Morgan",created:daysAgo(6)},
  {id:"DT-1038",title:"Payment confirmation is delayed",description:"Payment completed but confirmation has not appeared.",requester:"Isabella Moore",email:"isabella@example.com",category:"Billing",priority:"Medium",status:"Resolved",assignee:"Taylor Reed",created:daysAgo(7)},
  {id:"DT-1037",title:"Add keyboard shortcuts to ticket list",description:"Keyboard shortcuts could speed up ticket triage.",requester:"Mason White",email:"mason@example.com",category:"Feature Request",priority:"Low",status:"Open",assignee:"Jordan Lee",created:daysAgo(9)}
];

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast("Could not save data in this browser.", "error");
  }
}

let tickets = readJSON(STORAGE_KEY, null);
if (!Array.isArray(tickets)) {
  tickets = seedTickets;
  saveJSON(STORAGE_KEY, tickets);
}

let profile = readJSON(PROFILE_KEY, {
  name: "Alex Morgan",
  email: "demo@devtrack.com",
  timezone: "Asia/Kuala_Lumpur"
});

let prefs = readJSON(PREF_KEY, {
  dark: false,
  notifications: true,
  compact: false
});

let charts = {volume:null, status:null, priority:null};
let pendingDelete = null;

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
  })[char]);

const initials = name =>
  String(name || "U").trim().split(/\s+/).slice(0,2)
    .map(part => part[0]?.toUpperCase() || "").join("");

const activeCount = () =>
  tickets.filter(t => ["Open","In Progress"].includes(t.status)).length;

const resolvedCount = () =>
  tickets.filter(t => ["Resolved","Closed"].includes(t.status)).length;

const highCount = () =>
  tickets.filter(t => t.priority === "High" &&
    !["Resolved","Closed"].includes(t.status)).length;

const fmtDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" :
    date.toLocaleDateString(undefined, {
      month:"short", day:"numeric", year:"numeric"
    });
};

const statusClass = status => ({
  "Open":"status-open",
  "In Progress":"status-progress",
  "Resolved":"status-resolved",
  "Closed":"status-closed"
}[status] || "status-closed");

const statusBadge = status =>
  `<span class="status ${statusClass(status)}">${escapeHTML(status)}</span>`;

const priorityBadge = priority =>
  `<span class="priority priority-${String(priority).toLowerCase()}">${escapeHTML(priority)}</span>`;

function persistTickets() {
  saveJSON(STORAGE_KEY, tickets);
}

function toast(message, type = "") {
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.textContent = message;
  $("toastArea").appendChild(node);
  setTimeout(() => node.remove(), 3200);
}

/* Authentication: demo only, not production security. */
$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;

  if (email !== "demo@devtrack.com" || password !== "DevTrack123!") {
    $("loginError").textContent =
      "Invalid demo credentials. Please use the demo account shown below.";
    return;
  }

  sessionStorage.setItem(AUTH_KEY, "true");
  showApp();
});

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  $("appView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
  $("loginError").textContent = "";
  toast("You have signed out.");
}

$("logoutButton").addEventListener("click", logout);
$("settingsLogout").addEventListener("click", logout);

/* Navigation */
function showPage(page) {
  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== `page-${page}`);
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("breadcrumbPage").textContent = ({
    dashboard:"Overview",
    tickets:"Tickets",
    settings:"Settings"
  })[page] || "Overview";

  if (page === "dashboard") renderDashboard();
  if (page === "tickets") renderTickets();
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

$("viewAllTickets").addEventListener("click", () => showPage("tickets"));

function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  $("todayDate").textContent = new Date().toLocaleDateString(undefined, {
    weekday:"short", month:"short", day:"numeric", year:"numeric"
  });

  updateProfileUI();
  applyTheme();
  renderAll();
  showPage("dashboard");
}

function updateProfileUI() {
  const name = profile.name || "Alex Morgan";
  const email = profile.email || "demo@devtrack.com";

  $("sidebarName").textContent = name;
  $("sidebarAvatar").textContent = initials(name);
  $("settingsAvatar").textContent = initials(name);
  $("settingsDisplayName").textContent = name;
  $("settingsEmailDisplay").textContent = email;
  $("accountEmail").textContent = email;

  $("profileName").value = name;
  $("profileEmail").value = email;
  $("profileTimezone").value = profile.timezone || "Asia/Kuala_Lumpur";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" :
    hour < 18 ? "Good afternoon" : "Good evening";

  $("welcomeTitle").textContent =
    `${greeting}, ${name.split(" ")[0]} 👋`;
}

/* Theme */
function applyTheme() {
  document.body.classList.toggle("dark", !!prefs.dark);
  document.body.classList.toggle("compact-tickets", !!prefs.compact);
  $("themeButton").textContent = prefs.dark ? "☀" : "☾";

  if ($("darkToggle")) $("darkToggle").checked = !!prefs.dark;
  if ($("notifyToggle")) $("notifyToggle").checked = !!prefs.notifications;
  if ($("compactToggle")) $("compactToggle").checked = !!prefs.compact;
}

$("themeButton").addEventListener("click", () => {
  prefs.dark = !prefs.dark;
  saveJSON(PREF_KEY, prefs);
  applyTheme();
  renderDashboard();
});

/* Dashboard statistics and charts */
function renderDashboard() {
  const total = tickets.length;
  const open = activeCount();
  const high = highCount();
  const resolved = resolvedCount();

  $("statTotal").textContent = total;
  $("statOpen").textContent = open;
  $("statHigh").textContent = high;
  $("statResolved").textContent = resolved;
  $("resolvedFoot").textContent = total
    ? `${Math.round(resolved / total * 100)}% of all tickets completed`
    : "No tickets yet";

  $("sidebarTicketCount").textContent = total;
  $("ticketTotal").textContent = total;
  $("ticketOpen").textContent = open;
  $("ticketUrgent").textContent = high;
  $("ticketDone").textContent = resolved;

  const recent = [...tickets]
    .sort((a,b) => new Date(b.created) - new Date(a.created))
    .slice(0,5);

  $("recentTickets").innerHTML = recent.map(ticket => `
    <tr>
      <td>
        <div class="ticket-title">${escapeHTML(ticket.title)}</div>
        <span class="ticket-id">${escapeHTML(ticket.id)}</span>
      </td>
      <td>${statusBadge(ticket.status)}</td>
      <td>${priorityBadge(ticket.priority)}</td>
      <td>${fmtDate(ticket.created)}</td>
    </tr>
  `).join("") || `
    <tr><td colspan="4">
      <div class="empty-state"><strong>No tickets yet</strong>Create your first ticket to get started.</div>
    </td></tr>`;

  drawCharts();
}

function drawCharts() {
  if (typeof Chart === "undefined") {
    toast("Charts need an internet connection to load Chart.js.", "error");
    return;
  }

  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });

  const dark = document.body.classList.contains("dark");
  const gridColor = dark ? "#30364a" : "#edf0f6";
  const textColor = dark ? "#a0a8bf" : "#778198";

  const defaults = {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{
      legend:{display:false},
      tooltip:{backgroundColor:"#202641",padding:11}
    }
  };

  const labels = [];
  const volumes = [];

  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setHours(0,0,0,0);
    start.setDate(start.getDate() - i);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    labels.push(start.toLocaleDateString(undefined, {weekday:"short"}));

    volumes.push(tickets.filter(ticket => {
      const created = new Date(ticket.created);
      return created >= start && created < end;
    }).length);
  }

  charts.volume = new Chart($("volumeChart"), {
    type:"line",
    data:{
      labels,
      datasets:[{
        label:"Tickets",
        data:volumes,
        borderColor:"#635bff",
        backgroundColor:"rgba(99,91,255,.11)",
        fill:true,
        tension:.38,
        borderWidth:2.5,
        pointRadius:3,
        pointHoverRadius:5,
        pointBackgroundColor:"#635bff"
      }]
    },
    options:{
      ...defaults,
      scales:{
        x:{grid:{display:false},border:{display:false},
          ticks:{color:textColor,font:{size:10}}},
        y:{beginAtZero:true,
          ticks:{precision:0,color:textColor,font:{size:10},padding:10},
          grid:{color:gridColor},border:{display:false}}
      }
    }
  });

  const statuses = ["Open","In Progress","Resolved","Closed"];
  const statusValues = statuses.map(status =>
    tickets.filter(ticket => ticket.status === status).length
  );
  const statusColors = ["#635bff","#f3a536","#19a974","#a9b2c4"];

  charts.status = new Chart($("statusChart"), {
    type:"doughnut",
    data:{
      labels:statuses,
      datasets:[{
        data:statusValues,
        backgroundColor:statusColors,
        borderWidth:0,
        hoverOffset:5
      }]
    },
    options:{
      ...defaults,
      cutout:"73%"
    }
  });

  $("statusLegend").innerHTML = statuses.map((status,index) => `
    <div class="legend-item">
      <span class="dot" style="background:${statusColors[index]}"></span>
      ${status}<strong>${statusValues[index]}</strong>
    </div>
  `).join("");

  const priorities = ["High","Medium","Low"];
  const priorityValues = priorities.map(priority =>
    tickets.filter(ticket => ticket.priority === priority).length
  );

  charts.priority = new Chart($("priorityChart"), {
    type:"bar",
    data:{
      labels:priorities,
      datasets:[{
        data:priorityValues,
        backgroundColor:["#e85d75","#f3a536","#19a974"],
        borderRadius:6,
        barThickness:28
      }]
    },
    options:{
      ...defaults,
      scales:{
        x:{grid:{display:false},border:{display:false},
          ticks:{color:textColor,font:{size:10}}},
        y:{beginAtZero:true,
          ticks:{precision:0,color:textColor,font:{size:10},padding:8},
          grid:{color:gridColor},border:{display:false}}
      }
    }
  });
}

/* Ticket search, filters and table */
function renderTickets() {
  const query = $("ticketSearch").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const priority = $("priorityFilter").value;
  const category = $("categoryFilter").value;

  const filtered = [...tickets].filter(ticket => {
    const searchable = [
      ticket.id,ticket.title,ticket.description,ticket.requester,
      ticket.email,ticket.assignee,ticket.category
    ].join(" ").toLowerCase();

    return (!query || searchable.includes(query)) &&
      (!status || ticket.status === status) &&
      (!priority || ticket.priority === priority) &&
      (!category || ticket.category === category);
  }).sort((a,b) => new Date(b.created) - new Date(a.created));

  $("ticketRows").innerHTML = filtered.map(ticket => `
    <tr>
      <td>
        <div class="ticket-title">${escapeHTML(ticket.title)}</div>
        <div class="ticket-subtitle">${escapeHTML(ticket.description || "No description provided")}</div>
        <span class="ticket-id">${escapeHTML(ticket.id)}</span>
      </td>
      <td>
        <div>${escapeHTML(ticket.requester)}</div>
        <div class="small muted">${escapeHTML(ticket.assignee || "Unassigned")}</div>
      </td>
      <td>${escapeHTML(ticket.category)}</td>
      <td>${statusBadge(ticket.status)}</td>
      <td>${priorityBadge(ticket.priority)}</td>
      <td>${fmtDate(ticket.created)}</td>
      <td>
        <div class="row-actions">
          <button class="row-action" data-edit="${escapeHTML(ticket.id)}" title="Edit ticket">✎</button>
          <button class="row-action delete" data-delete="${escapeHTML(ticket.id)}" title="Delete ticket">×</button>
        </div>
      </td>
    </tr>
  `).join("") || `
    <tr><td colspan="7">
      <div class="empty-state"><div>⌕</div><strong>No matching tickets</strong>Try adjusting your search or filters.</div>
    </td></tr>`;

  $("ticketResultCount").textContent =
    `Showing ${filtered.length} of ${tickets.length} tickets`;

  $("sidebarTicketCount").textContent = tickets.length;

  $("ticketRows").querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => openTicketModal(button.dataset.edit));
  });

  $("ticketRows").querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => askDelete(button.dataset.delete));
  });
}

["ticketSearch","statusFilter","priorityFilter","categoryFilter"].forEach(id => {
  $(id).addEventListener(id === "ticketSearch" ? "input" : "change", renderTickets);
});

$("clearFilters").addEventListener("click", () => {
  $("ticketSearch").value = "";
  $("statusFilter").value = "";
  $("priorityFilter").value = "";
  $("categoryFilter").value = "";
  renderTickets();
});

/* Shared create/edit ticket modal */
$("headerCreateButton").addEventListener("click", () => openTicketModal());

function openTicketModal(id = null) {
  $("ticketForm").reset();
  $("ticketEditId").value = "";
  $("ticketModal").classList.remove("hidden");

  if (id) {
    const ticket = tickets.find(item => item.id === id);
    if (!ticket) return;

    $("modalTitle").textContent = "Edit ticket";
    $("saveTicketButton").textContent = "Save changes";
    $("ticketEditId").value = ticket.id;
    $("ticketTitle").value = ticket.title;
    $("ticketDescription").value = ticket.description || "";
    $("ticketRequester").value = ticket.requester;
    $("ticketEmail").value = ticket.email || "";
    $("ticketCategory").value = ticket.category;
    $("ticketPriority").value = ticket.priority;
    $("ticketStatus").value = ticket.status;
    $("ticketAssignee").value = ticket.assignee || "";
  } else {
    $("modalTitle").textContent = "Create ticket";
    $("saveTicketButton").textContent = "Create ticket";
    $("ticketStatus").value = "Open";
    $("ticketPriority").value = "Medium";
  }

  setTimeout(() => $("ticketTitle").focus(), 50);
}

function closeTicketModal() {
  $("ticketModal").classList.add("hidden");
}

$("closeModal").addEventListener("click", closeTicketModal);
$("cancelModal").addEventListener("click", closeTicketModal);

$("ticketModal").addEventListener("click", event => {
  if (event.target === $("ticketModal")) closeTicketModal();
});

$("ticketForm").addEventListener("submit", event => {
  event.preventDefault();

  const editId = $("ticketEditId").value;
  const title = $("ticketTitle").value.trim();
  const requester = $("ticketRequester").value.trim();

  if (!title || !requester) {
    toast("Please complete the required fields.", "error");
    return;
  }

  const data = {
    title,
    description:$("ticketDescription").value.trim(),
    requester,
    email:$("ticketEmail").value.trim(),
    category:$("ticketCategory").value,
    priority:$("ticketPriority").value,
    status:$("ticketStatus").value,
    assignee:$("ticketAssignee").value.trim()
  };

  if (editId) {
    const index = tickets.findIndex(ticket => ticket.id === editId);
    if (index < 0) return;

    tickets[index] = {...tickets[index], ...data};
    toast("Ticket updated successfully.");
  } else {
    const highestId = tickets.reduce((max,ticket) =>
      Math.max(max, Number(String(ticket.id).replace(/\D/g,"")) || 1036), 1036
    );

    tickets.push({
      id:`DT-${highestId + 1}`,
      created:new Date().toISOString(),
      ...data
    });

    if (prefs.notifications) toast("Ticket created successfully.");
  }

  persistTickets();
  closeTicketModal();
  renderAll();
  showPage("tickets");
});

/* Delete with confirmation */
function askDelete(id) {
  const ticket = tickets.find(item => item.id === id);
  if (!ticket) return;

  pendingDelete = id;
  $("confirmCopy").textContent =
    `"${ticket.title}" (${ticket.id}) will be permanently removed from this browser's demo data.`;
  $("confirmModal").classList.remove("hidden");
}

function closeConfirm() {
  $("confirmModal").classList.add("hidden");
  pendingDelete = null;
}

$("closeConfirm").addEventListener("click", closeConfirm);
$("cancelConfirm").addEventListener("click", closeConfirm);

$("confirmModal").addEventListener("click", event => {
  if (event.target === $("confirmModal")) closeConfirm();
});

$("confirmDelete").addEventListener("click", () => {
  if (!pendingDelete) return;

  tickets = tickets.filter(ticket => ticket.id !== pendingDelete);
  persistTickets();
  closeConfirm();
  renderAll();
  toast("Ticket deleted.");
});

/* Settings navigation */
document.querySelectorAll(".settings-link").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".settings-link").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    ["profile","preferences","account"].forEach(section => {
      $(`settings-${section}`).classList.toggle(
        "hidden", section !== button.dataset.settings
      );
    });
  });
});

$("profileForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("profileName").value.trim();
  const email = $("profileEmail").value.trim();

  if (!name || !email) {
    toast("Name and email are required.", "error");
    return;
  }

  profile = {
    ...profile,
    name,
    email,
    timezone:$("profileTimezone").value
  };

  saveJSON(PROFILE_KEY, profile);
  updateProfileUI();
  toast("Profile saved.");
});

$("darkToggle").addEventListener("change", event => {
  prefs.dark = event.target.checked;
  applyTheme();
});

$("savePreferences").addEventListener("click", () => {
  prefs.dark = $("darkToggle").checked;
  prefs.notifications = $("notifyToggle").checked;
  prefs.compact = $("compactToggle").checked;

  saveJSON(PREF_KEY, prefs);
  applyTheme();
  renderDashboard();
  toast("Preferences saved.");
});

/* CSV export */
function downloadCSV() {
  const headers = [
    "ID","Title","Description","Requester","Email",
    "Category","Priority","Status","Assignee","Created"
  ];

  const rows = tickets.map(ticket => [
    ticket.id,ticket.title,ticket.description,ticket.requester,
    ticket.email,ticket.category,ticket.priority,ticket.status,
    ticket.assignee,ticket.created
  ]);

  const csv = [headers,...rows].map(row =>
    row.map(value => `"${String(value ?? "").replace(/"/g,'""')}"`).join(",")
  ).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type:"text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "devtrack-tickets.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  toast("CSV export downloaded.");
}

$("exportButton").addEventListener("click", downloadCSV);
$("ticketExportButton").addEventListener("click", downloadCSV);

$("helpButton").addEventListener("click", () => {
  toast("Use Overview for analytics, Tickets to manage requests, and Settings to personalize your workspace.");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeTicketModal();
    closeConfirm();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    if (!$("appView").classList.contains("hidden")) {
      event.preventDefault();
      showPage("tickets");
      $("ticketSearch").focus();
    }
  }
});

function renderAll() {
  renderDashboard();
  renderTickets();
}

/* Initialize */
applyTheme();

if (sessionStorage.getItem(AUTH_KEY) === "true") {
  showApp();
}
