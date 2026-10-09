const STORAGE_KEY = "devtrack-tickets-v1";

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

function loadTickets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return starterTickets.map(ticket => ({ ...ticket }));
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let tickets = loadTickets();
let activeFilter = "All";

const $ = id => document.getElementById(id);
const dialog = $("ticketDialog");

function saveTickets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    return true;
  } catch {
    alert("Could not save tickets. Check your browser storage settings.");
    return false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function render() {
  $("total").textContent = tickets.length;
  $("open").textContent = tickets.filter(t => t.status === "Open").length;
  $("progress").textContent = tickets.filter(t => t.status === "In Progress").length;
  $("resolved").textContent = tickets.filter(t => t.status === "Resolved").length;

  const query = $("search").value.trim().toLowerCase();

  const filtered = tickets.filter(ticket => {
    const matchesFilter = activeFilter === "All" || ticket.status === activeFilter;
    const matchesSearch = `${ticket.title} ${ticket.category} ${ticket.id}`
      .toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  $("ticketList").innerHTML = filtered.length
    ? filtered.map(ticket => `
      <tr>
        <td>
          <div class="ticket-title">${escapeHTML(ticket.title)}</div>
          <div class="ticket-id">#${ticket.id}</div>
        </td>
        <td>${escapeHTML(ticket.category)}</td>
        <td><span class="badge ${escapeHTML(ticket.priority)}">${escapeHTML(ticket.priority)}</span></td>
        <td><span class="badge ${ticket.status.replace(/\s/g, "-")}">${escapeHTML(ticket.status)}</span></td>
        <td>${escapeHTML(ticket.created)}</td>
        <td>
          <div class="action-group">
            <button class="action" data-edit="${ticket.id}">Edit</button>
            <button class="action delete" data-delete="${ticket.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="6" style="text-align:center;padding:40px;color:#8490a5">
        No tickets found. Create a new ticket or change your filters.
       </td></tr>`;

  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === activeFilter);
  });
}

function openForm(ticket = null) {
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

$("addButton").addEventListener("click", () => openForm());
$("closeButton").addEventListener("click", () => dialog.close());
$("search").addEventListener("input", render);

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    render();
  });
});

$("ticketList").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const ticket = tickets.find(t => t.id === Number(editButton.dataset.edit));
    if (ticket) openForm(ticket);
  }

  if (deleteButton) {
    const id = Number(deleteButton.dataset.delete);
    const ticket = tickets.find(t => t.id === id);

    if (ticket && confirm(`Delete "${ticket.title}"?`)) {
      const previous = tickets;
      tickets = tickets.filter(t => t.id !== id);
      if (saveTickets()) render();
      else tickets = previous;
    }
  }
});

$("ticketForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("ticketId").value;
  const existing = tickets.find(t => t.id === Number(id));

  const ticket = {
    id: existing?.id ?? Date.now(),
    title: $("title").value.trim(),
    description: $("description").value.trim(),
    category: $("category").value,
    priority: $("priority").value,
    status: $("status").value,
    created: existing?.created ?? new Date().toISOString().slice(0, 10)
  };

  if (!ticket.title || !ticket.description) return;

  const previous = tickets;

  tickets = existing
    ? tickets.map(t => t.id === existing.id ? ticket : t)
    : [ticket, ...tickets];

  if (saveTickets()) {
    dialog.close();
    render();
  } else {
    tickets = previous;
  }
});

render();