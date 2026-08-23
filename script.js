// State Management
let state = {
  notes: [],
  profile: { name: "User Name" },
  theme: "light",
  currentSection: "dashboard", // dashboard, active, work, personal, archived, trash, profile, settings
  searchQuery: "",
  editingNoteId: null,
  activeModal: null,
  confirmCallback: null
};

// DOM Elements Cache
const elements = {
  sidebar: document.getElementById("sidebar"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  menuToggleBtn: document.getElementById("menuToggleBtn"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),
  navButtons: document.querySelectorAll(".nav-btn"),
  pageTitle: document.getElementById("pageTitle"),
  globalSearch: document.getElementById("globalSearch"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  themeQuickToggleBtn: document.getElementById("themeQuickToggleBtn"),
  profileIconBtn: document.getElementById("profileIconBtn"),
  badgeUserName: document.getElementById("badgeUserName"),
  avatarInitials: document.getElementById("avatarInitials"),
  userBadgeBtn: document.getElementById("userBadgeBtn"),

  // Views
  views: {
    dashboard: document.getElementById("view-dashboard"),
    notes: document.getElementById("view-notes"),
    trash: document.getElementById("view-trash"),
    profile: document.getElementById("view-profile"),
    settings: document.getElementById("view-settings")
  },

  // Dashboard Stats
  stats: {
    active: document.getElementById("statActiveCount"),
    work: document.getElementById("statWorkCount"),
    personal: document.getElementById("statPersonalCount"),
    archived: document.getElementById("statArchivedCount"),
    trash: document.getElementById("statTrashCount"),
    total: document.getElementById("statTotalCount")
  },
  recentNotesList: document.getElementById("recentNotesList"),

  // Note Creation Form
  noteCreationCard: document.getElementById("noteCreationCard"),
  noteTitleInput: document.getElementById("noteTitleInput"),
  noteContentInput: document.getElementById("noteContentInput"),
  noteCategorySelect: document.getElementById("noteCategorySelect"),
  addNoteBtn: document.getElementById("addNoteBtn"),

  // List Containers
  notesListContainer: document.getElementById("notesListContainer"),
  trashListContainer: document.getElementById("trashListContainer"),

  // Profile View
  profileNameInput: document.getElementById("profileNameInput"),
  saveProfileBtn: document.getElementById("saveProfileBtn"),
  profileAvatarLarge: document.getElementById("profileAvatarLarge"),
  profileStats: {
    active: document.getElementById("profileStatActive"),
    archived: document.getElementById("profileStatArchived"),
    trash: document.getElementById("profileStatTrash"),
    total: document.getElementById("profileStatTotal")
  },

  // Settings View
  themeRadios: document.getElementsByName("app-theme"),
  downloadNotesBtn: document.getElementById("downloadNotesBtn"),
  downloadDropdown: document.getElementById("downloadDropdown"),
  deleteAllNotesBtn: document.getElementById("deleteAllNotesBtn"),

  // Edit Modal
  editModal: document.getElementById("editNoteModal"),
  closeEditModalBtn: document.getElementById("closeEditModalBtn"),
  editNoteTitle: document.getElementById("editNoteTitle"),
  editNoteCategory: document.getElementById("editNoteCategory"),
  editNoteContent: document.getElementById("editNoteContent"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  saveEditBtn: document.getElementById("saveEditBtn"),

  // Confirm Modal
  confirmModal: document.getElementById("confirmModal"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmMessage: document.getElementById("confirmMessage"),
  cancelConfirmBtn: document.getElementById("cancelConfirmBtn"),
  okConfirmBtn: document.getElementById("okConfirmBtn"),
  closeConfirmModalBtn: document.getElementById("closeConfirmModalBtn"),

  // Toasts
  toastContainer: document.getElementById("toastContainer")
};

// --- Storage Utilities ---
function getNotes() {
  const rawNotes = localStorage.getItem("notes");
  let notes = [];
  try {
    notes = rawNotes ? JSON.parse(rawNotes) : [];
  } catch (e) {
    notes = [];
  }

  // Data Migration/Compatibility Layer (Ensure consistent object format)
  let updated = false;
  const migrated = notes.map(note => {
    const now = new Date().toISOString();
    let isMigrated = false;
    
    const id = note.id || (() => { isMigrated = true; return Math.random().toString(36).substring(2, 9) + Date.now().toString(36); })();
    const title = note.title || "Untitled Note";
    const content = note.content || note.text || ""; // migrate note.text to content
    const category = note.category ? note.category.toLowerCase() : "personal";
    const status = note.status || "active";
    const createdAt = note.createdAt || now;
    const updatedAt = note.updatedAt || now;
    const deletedAt = note.deletedAt || null;

    if (note.text) { isMigrated = true; } // old note.text mapped
    if (!note.id || !note.category || !note.status || !note.createdAt || !note.updatedAt) { isMigrated = true; }

    if (isMigrated) { updated = true; }

    return { id, title, content, category, status, createdAt, updatedAt, deletedAt };
  });

  if (updated || notes.length !== migrated.length) {
    localStorage.setItem("notes", JSON.stringify(migrated));
  }
  return migrated;
}

function saveNotes(notes) {
  state.notes = notes;
  localStorage.setItem("notes", JSON.stringify(notes));
  renderBadges();
}

function getUserProfile() {
  const profile = localStorage.getItem("userProfile");
  if (profile) {
    try {
      return JSON.parse(profile);
    } catch (e) {
      return { name: "User Name" };
    }
  }
  return { name: "User Name" };
}

function saveUserProfile(profile) {
  state.profile = profile;
  localStorage.setItem("userProfile", JSON.stringify(profile));
  updateProfileUI();
}

function getTheme() {
  return localStorage.getItem("theme") || "light";
}

function saveTheme(theme) {
  state.theme = theme;
  localStorage.setItem("theme", theme);
  applyTheme(theme);
}

// --- Cleanup Mechanism ---
function cleanupTrash() {
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  const notes = getNotes();

  const filteredNotes = notes.filter(note => {
    if (note.status === "trash" && note.deletedAt) {
      const deletedTime = new Date(note.deletedAt).getTime();
      if (now - deletedTime > THREE_DAYS_MS) {
        return false; // delete permanently
      }
    }
    return true;
  });

  if (filteredNotes.length !== notes.length) {
    saveNotes(filteredNotes);
    console.log(`Auto-cleaned ${notes.length - filteredNotes.length} expired trash notes.`);
  }
}

// --- Date Formatting Helpers ---
function getRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

function formatAbsoluteDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function getTrashCountdown(deletedAtIso) {
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const deletedTime = new Date(deletedAtIso).getTime();
  const expiryTime = deletedTime + THREE_DAYS_MS;
  const now = new Date().getTime();
  const remainingMs = expiryTime - now;

  if (remainingMs <= 0) return "Permanent deletion imminent";

  const remainingSec = Math.floor(remainingMs / 1000);
  const remainingMin = Math.floor(remainingSec / 60);
  const remainingHr = Math.floor(remainingMin / 60);
  const remainingDays = Math.floor(remainingHr / 24);

  if (remainingDays >= 1) {
    const hours = remainingHr % 24;
    return `Permanent deletion in ${remainingDays}d ${hours}h`;
  }
  if (remainingHr >= 1) {
    const mins = remainingMin % 60;
    return `Permanent deletion in ${remainingHr}h ${mins}m`;
  }
  return `Permanent deletion in ${remainingMin}m`;
}

// --- UI Theme Control ---
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  
  // Update theme toggle buttons / radio inputs
  if (elements.themeQuickToggleBtn) {
    elements.themeQuickToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
  
  elements.themeRadios.forEach(radio => {
    radio.checked = radio.value === theme;
  });
}

// --- Toast Feedback ---
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-xmark";
  if (type === "info") icon = "fa-circle-info";
  if (type === "warning") icon = "fa-triangle-exclamation";

  toast.innerHTML = `
    <div class="toast-content">
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close-btn"><i class="fa-solid fa-xmark"></i></button>
  `;

  // Close toast event
  toast.querySelector(".toast-close-btn").addEventListener("click", () => {
    toast.remove();
  });

  elements.toastContainer.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3000);
}

// --- Confirmation Modals ---
function openModal(modal) {
  state.activeModal = modal;
  modal.classList.add("active");
}

function closeModal(modal) {
  modal.classList.remove("active");
  state.activeModal = null;
}

function showConfirmModal(title, message, onConfirm) {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  state.confirmCallback = onConfirm;
  openModal(elements.confirmModal);
}

// --- Navigation Controller ---
function navigateTo(section) {
  state.currentSection = section;
  
  // Highlight active navigation items
  elements.navButtons.forEach(btn => {
    if (btn.getAttribute("data-section") === section) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Hide all view panels and show the target panel
  Object.keys(elements.views).forEach(key => {
    elements.views[key].classList.remove("active");
  });

  // Decide page title & which DOM container is displayed
  let displayTitle = "Dashboard";
  if (section === "dashboard") {
    elements.views.dashboard.classList.add("active");
    displayTitle = "Dashboard";
  } else if (["active", "work", "personal", "archived"].includes(section)) {
    elements.views.notes.classList.add("active");
    
    // Toggle note creation card visibility (not for archived notes)
    if (section === "archived") {
      elements.noteCreationCard.style.display = "none";
      displayTitle = "Archived Notes";
    } else {
      elements.noteCreationCard.style.display = "block";
      displayTitle = section === "active" ? "Active Notes" : (section === "work" ? "Work Notes" : "Personal Notes");
      
      // Auto-preselect category dropdown matching current section
      if (section === "work" || section === "personal") {
        elements.noteCategorySelect.value = section;
      }
    }
  } else if (section === "trash") {
    elements.views.trash.classList.add("active");
    displayTitle = "Trash Bin";
  } else if (section === "profile") {
    elements.views.profile.classList.add("active");
    displayTitle = "My Profile";
  } else if (section === "settings") {
    elements.views.settings.classList.add("active");
    displayTitle = "Settings";
  }

  elements.pageTitle.textContent = displayTitle;

  // Clear search field focus or results between view changes if appropriate, or re-render
  renderActiveView();

  // Close mobile sidebar on navigate
  elements.sidebar.classList.remove("active");
  elements.sidebarBackdrop.classList.remove("active");
}

// --- Statistics badges updater ---
function renderBadges() {
  const activeCount = state.notes.filter(n => n.status === "active").length;
  const workCount = state.notes.filter(n => n.status === "active" && n.category === "work").length;
  const personalCount = state.notes.filter(n => n.status === "active" && n.category === "personal").length;
  const archivedCount = state.notes.filter(n => n.status === "archived").length;
  const trashCount = state.notes.filter(n => n.status === "trash").length;
  const totalCount = activeCount + archivedCount + trashCount;

  // Dashboard Stats update
  elements.stats.active.textContent = activeCount;
  elements.stats.work.textContent = workCount;
  elements.stats.personal.textContent = personalCount;
  elements.stats.archived.textContent = archivedCount;
  elements.stats.trash.textContent = trashCount;
  elements.stats.total.textContent = totalCount;

  // Profile page Stats update
  elements.profileStats.active.textContent = activeCount;
  elements.profileStats.archived.textContent = archivedCount;
  elements.profileStats.trash.textContent = trashCount;
  elements.profileStats.total.textContent = totalCount;
}

// --- Render Operations ---
function renderActiveView() {
  renderBadges();
  const query = state.searchQuery.toLowerCase().trim();

  if (state.currentSection === "dashboard") {
    renderDashboard();
  } else if (["active", "work", "personal", "archived"].includes(state.currentSection)) {
    renderNotesList(state.currentSection, query);
  } else if (state.currentSection === "trash") {
    renderTrashList(query);
  } else if (state.currentSection === "profile") {
    renderProfileView();
  }
}

function renderDashboard() {
  // Update welcome greeting name
  document.getElementById("welcomeMessage").textContent = `Welcome back, ${state.profile.name} 👋`;

  // Render recent 5 notes
  const activeNotes = state.notes.filter(n => n.status !== "trash");
  const sorted = [...activeNotes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const recents = sorted.slice(0, 5);

  elements.recentNotesList.innerHTML = "";
  if (recents.length === 0) {
    elements.recentNotesList.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon"><i class="fa-regular fa-folder-open"></i></div>
        <h3>No recent notes</h3>
        <p>Created notes will appear here.</p>
      </div>
    `;
    return;
  }

  recents.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-item";
    
    const relativeTime = getRelativeTime(note.updatedAt);
    const shortText = note.content.length > 80 ? note.content.substring(0, 80) + "..." : note.content;

    card.innerHTML = `
      <div class="note-item-header">
        <h4 class="note-item-title">${escapeHTML(note.title)}</h4>
        <span class="note-item-badge badge-${note.category}">${note.category}</span>
      </div>
      <p class="note-item-body truncated">${escapeHTML(shortText)}</p>
      <div class="note-item-footer">
        <span class="note-item-time"><i class="fa-regular fa-clock"></i> Updated ${relativeTime}</span>
        <button class="note-read-more-btn" data-id="${note.id}"><i class="fa-solid fa-expand"></i> View</button>
      </div>
    `;

    // Event listener to open note detail or load details
    card.querySelector(".note-read-more-btn").addEventListener("click", () => {
      openEditModal(note.id);
    });

    elements.recentNotesList.appendChild(card);
  });
}

function renderNotesList(section, query) {
  elements.notesListContainer.innerHTML = "";
  
  // Filter active, work, personal, or archived notes
  let list = state.notes.filter(note => {
    if (section === "active") {
      return note.status === "active";
    } else if (section === "work") {
      return note.status === "active" && note.category === "work";
    } else if (section === "personal") {
      return note.status === "active" && note.category === "personal";
    } else if (section === "archived") {
      return note.status === "archived";
    }
    return false;
  });

  // Filter with Search query if matching title, content, or category
  if (query !== "") {
    list = list.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query)
    );
  }

  // Handle Empty State
  if (list.length === 0) {
    let emptyIcon = "fa-pen-to-square";
    let emptyTitle = "No active notes yet";
    let emptyDesc = "Create your first note above to get started.";

    if (query !== "") {
      emptyIcon = "fa-magnifying-glass";
      emptyTitle = "No notes found";
      emptyDesc = "Try searching for different keywords.";
    } else if (section === "work") {
      emptyIcon = "fa-briefcase";
      emptyTitle = "No Work notes yet";
      emptyDesc = "Tag notes as 'Work' to organize files.";
    } else if (section === "personal") {
      emptyIcon = "fa-house-user";
      emptyTitle = "No Personal notes yet";
      emptyDesc = "Tag notes as 'Personal' to organize files.";
    } else if (section === "archived") {
      emptyIcon = "fa-box-archive";
      emptyTitle = "No archived notes";
      emptyDesc = "Archive notes to clear them from your inbox.";
    }

    elements.notesListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid ${emptyIcon}"></i></div>
        <h3>${emptyTitle}</h3>
        <p>${emptyDesc}</p>
      </div>
    `;
    return;
  }

  // Render cards
  list.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-item";
    card.id = `note-${note.id}`;

    const hasLongText = note.content.length > 120;
    const shortText = hasLongText ? note.content.substring(0, 120) + "..." : note.content;
    const isArchived = note.status === "archived";

    card.innerHTML = `
      <div class="note-item-header">
        <h3 class="note-item-title">${escapeHTML(note.title)}</h3>
        <span class="note-item-badge badge-${note.category}">${note.category}</span>
      </div>
      <p class="note-item-body short-desc ${hasLongText ? 'truncated' : ''}">${escapeHTML(shortText)}</p>
      <p class="note-item-body full-desc" style="display: none;">${escapeHTML(note.content)}</p>
      
      ${hasLongText ? `<button class="note-read-more-btn toggle-read-btn">Read Full Note</button>` : ""}
      
      <div class="note-item-footer">
        <span class="note-item-time"><i class="fa-regular fa-calendar"></i> ${formatAbsoluteDate(note.createdAt)}</span>
        <div class="note-item-actions">
          <button class="note-action-icon-btn view-edit-btn" title="View/Edit note"><i class="fa-regular fa-pen-to-square"></i></button>
          <button class="note-action-icon-btn archive-toggle-btn" title="${isArchived ? 'Restore note' : 'Archive note'}">
            <i class="fa-solid ${isArchived ? 'fa-box-open' : 'fa-box-archive'}"></i>
          </button>
          <button class="note-action-icon-btn delete-icon delete-btn" title="Move to Trash"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </div>
    `;

    // Hook up read more toggler
    if (hasLongText) {
      const toggleBtn = card.querySelector(".toggle-read-btn");
      const shortDesc = card.querySelector(".short-desc");
      const fullDesc = card.querySelector(".full-desc");
      
      toggleBtn.addEventListener("click", () => {
        const isCollapsed = fullDesc.style.display === "none";
        if (isCollapsed) {
          fullDesc.style.display = "block";
          shortDesc.style.display = "none";
          toggleBtn.textContent = "Show Less";
        } else {
          fullDesc.style.display = "none";
          shortDesc.style.display = "block";
          toggleBtn.textContent = "Read Full Note";
        }
      });
    }

    // Attach actions
    card.querySelector(".view-edit-btn").addEventListener("click", () => openEditModal(note.id));
    card.querySelector(".archive-toggle-btn").addEventListener("click", () => toggleArchiveNote(note.id));
    card.querySelector(".delete-btn").addEventListener("click", () => deleteNoteToTrash(note.id));

    elements.notesListContainer.appendChild(card);
  });
}

function renderTrashList(query) {
  elements.trashListContainer.innerHTML = "";
  
  let list = state.notes.filter(note => note.status === "trash");

  if (query !== "") {
    list = list.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  }

  if (list.length === 0) {
    const title = query !== "" ? "No notes found" : "Trash is empty";
    const desc = query !== "" ? "Try searching for other words." : "Notes you delete will appear here.";
    
    elements.trashListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-trash-can"></i></div>
        <h3>${title}</h3>
        <p>${desc}</p>
      </div>
    `;
    return;
  }

  list.forEach(note => {
    const card = document.createElement("div");
    card.className = "note-item";
    
    const shortText = note.content.length > 100 ? note.content.substring(0, 100) + "..." : note.content;
    const deletedFormatted = formatAbsoluteDate(note.deletedAt);
    const countdown = getTrashCountdown(note.deletedAt);

    card.innerHTML = `
      <div class="note-item-header">
        <h3 class="note-item-title">${escapeHTML(note.title)}</h3>
        <span class="note-item-badge badge-${note.category}">${note.category}</span>
      </div>
      <p class="note-item-body truncated">${escapeHTML(shortText)}</p>
      
      <div class="trash-item-deleted-time">Deleted: ${deletedFormatted}</div>
      <span class="trash-item-countdown"><i class="fa-regular fa-clock"></i> ${countdown}</span>
      
      <div class="note-item-footer">
        <span class="note-item-time">ID: ${note.id}</span>
        <div class="note-item-actions">
          <button class="note-action-icon-btn restore-btn" title="Restore note"><i class="fa-solid fa-arrow-rotate-left"></i></button>
          <button class="note-action-icon-btn delete-icon permanent-delete-btn" title="Delete Permanently"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `;

    card.querySelector(".restore-btn").addEventListener("click", () => restoreFromTrash(note.id));
    card.querySelector(".permanent-delete-btn").addEventListener("click", () => promptPermanentDelete(note.id));

    elements.trashListContainer.appendChild(card);
  });
}

function renderProfileView() {
  elements.profileNameInput.value = state.profile.name;
  updateProfileUI();
}

function updateProfileUI() {
  const initials = state.profile.name ? state.profile.name.trim().charAt(0).toUpperCase() : "?";
  
  if (elements.avatarInitials) elements.avatarInitials.textContent = initials;
  if (elements.profileAvatarLarge) elements.profileAvatarLarge.textContent = initials;
  if (elements.profileIconBtn) elements.profileIconBtn.textContent = initials;
  if (elements.badgeUserName) elements.badgeUserName.textContent = state.profile.name;
}

// --- Notes Logic Commands ---
function createNote() {
  const title = elements.noteTitleInput.value.trim();
  const content = elements.noteContentInput.value.trim();
  const category = elements.noteCategorySelect.value;

  if (title === "") {
    showToast("Title cannot be empty!", "error");
    return;
  }

  const now = new Date().toISOString();
  const newNote = {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    title,
    content,
    category,
    status: "active",
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };

  const notes = getNotes();
  notes.push(newNote);
  saveNotes(notes);

  // Clear inputs
  elements.noteTitleInput.value = "";
  elements.noteContentInput.value = "";
  
  showToast("✓ Note created successfully");
  renderActiveView();
}

function openEditModal(id) {
  const notes = getNotes();
  const note = notes.find(n => n.id === id);
  if (!note) return;

  state.editingNoteId = id;
  elements.editNoteTitle.value = note.title;
  elements.editNoteCategory.value = note.category;
  elements.editNoteContent.value = note.content;

  openModal(elements.editModal);
}

function saveEditNote() {
  const id = state.editingNoteId;
  const title = elements.editNoteTitle.value.trim();
  const category = elements.editNoteCategory.value;
  const content = elements.editNoteContent.value.trim();

  if (title === "") {
    showToast("Title cannot be empty!", "error");
    return;
  }

  const notes = getNotes();
  const noteIndex = notes.findIndex(n => n.id === id);
  if (noteIndex !== -1) {
    notes[noteIndex].title = title;
    notes[noteIndex].category = category;
    notes[noteIndex].content = content;
    notes[noteIndex].updatedAt = new Date().toISOString();
    
    saveNotes(notes);
    showToast("✓ Note updated");
    closeModal(elements.editModal);
    renderActiveView();
  }
}

function toggleArchiveNote(id) {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index !== -1) {
    const isArchived = notes[index].status === "archived";
    notes[index].status = isArchived ? "active" : "archived";
    notes[index].updatedAt = new Date().toISOString();

    saveNotes(notes);
    showToast(isArchived ? "✓ Note restored from Archive" : "✓ Note archived");
    renderActiveView();
  }
}

function deleteNoteToTrash(id) {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index !== -1) {
    notes[index].status = "trash";
    notes[index].deletedAt = new Date().toISOString();
    notes[index].updatedAt = new Date().toISOString();

    saveNotes(notes);
    showToast("✓ Note moved to Trash");
    renderActiveView();
  }
}

function restoreFromTrash(id) {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === id);
  if (index !== -1) {
    notes[index].status = "active";
    notes[index].deletedAt = null;
    notes[index].updatedAt = new Date().toISOString();

    saveNotes(notes);
    showToast("✓ Note restored");
    renderActiveView();
  }
}

function promptPermanentDelete(id) {
  showConfirmModal(
    "Delete Permanently",
    "This note will be permanently deleted and cannot be recovered. Are you sure?",
    () => {
      const notes = getNotes();
      const filtered = notes.filter(n => n.id !== id);
      saveNotes(filtered);
      showToast("✓ Note permanently deleted");
      renderActiveView();
    }
  );
}

function deleteAllNotesToTrash() {
  showConfirmModal(
    "Delete All Notes?",
    "All of your active and archived notes will be moved to the Trash bin.",
    () => {
      const notes = getNotes();
      let count = 0;
      const updated = notes.map(note => {
        if (note.status !== "trash") {
          note.status = "trash";
          note.deletedAt = new Date().toISOString();
          note.updatedAt = new Date().toISOString();
          count++;
        }
        return note;
      });

      if (count > 0) {
        saveNotes(updated);
        showToast(`✓ Moved ${count} notes to Trash`);
        renderActiveView();
      } else {
        showToast("No active or archived notes found to delete", "info");
      }
    }
  );
}

// --- Downloads Controller ---
function downloadNotes(format) {
  const notes = getNotes().filter(note => note.status !== "trash");
  
  if (notes.length === 0) {
    showToast("No active or archived notes available to download", "warning");
    return;
  }

  let fileContent = "";
  let mimeType = "text/plain";
  let fileName = `noteflow_backup_${new Date().toISOString().slice(0,10)}`;

  if (format === "json") {
    // Only download necessary schema details
    const cleanNotes = notes.map(({ title, content, category, status, createdAt, updatedAt }) => ({
      title, content, category, status, createdAt, updatedAt
    }));
    fileContent = JSON.stringify(cleanNotes, null, 2);
    mimeType = "application/json";
    fileName += ".json";
  } else if (format === "txt") {
    notes.forEach((note, index) => {
      fileContent += `Note #${index + 1}\r\n`;
      fileContent += `Title: ${note.title}\r\n`;
      fileContent += `Category: ${note.category}\r\n`;
      fileContent += `Status: ${note.status}\r\n`;
      fileContent += `Created: ${formatAbsoluteDate(note.createdAt)}\r\n`;
      fileContent += `Updated: ${formatAbsoluteDate(note.updatedAt)}\r\n`;
      fileContent += `----------------------------------------\r\n`;
      fileContent += `${note.content}\r\n`;
      fileContent += `========================================\r\n\r\n`;
    });
    fileName += ".txt";
  }

  const blob = new Blob([fileContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast("✓ Notes downloaded");
}

// --- Events Bindings ---
function initEvents() {
  // Sidebar toggles (Responsive for mobile & laptop/desktop)
  elements.menuToggleBtn.addEventListener("click", () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      elements.sidebar.classList.toggle("active");
      elements.sidebarBackdrop.classList.toggle("active");
    } else {
      elements.sidebar.classList.toggle("collapsed");
    }
  });

  elements.closeSidebarBtn.addEventListener("click", () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      elements.sidebar.classList.remove("active");
      elements.sidebarBackdrop.classList.remove("active");
    } else {
      elements.sidebar.classList.add("collapsed");
    }
  });

  elements.sidebarBackdrop.addEventListener("click", () => {
    elements.sidebar.classList.remove("active");
    elements.sidebarBackdrop.classList.remove("active");
  });

  // Sidebar navigation click routing
  elements.navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.getAttribute("data-section");
      navigateTo(section);
    });
  });

  // Quick header links routing
  elements.profileIconBtn.addEventListener("click", () => navigateTo("profile"));
  elements.userBadgeBtn.addEventListener("click", () => navigateTo("profile"));

  // Global search input listening
  elements.globalSearch.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery !== "") {
      elements.clearSearchBtn.style.display = "block";
    } else {
      elements.clearSearchBtn.style.display = "none";
    }
    renderActiveView();
  });

  // Search input clear button
  elements.clearSearchBtn.addEventListener("click", () => {
    elements.globalSearch.value = "";
    state.searchQuery = "";
    elements.clearSearchBtn.style.display = "none";
    renderActiveView();
  });

  // Theme quick toggle
  elements.themeQuickToggleBtn.addEventListener("click", () => {
    const targetTheme = state.theme === "light" ? "dark" : "light";
    saveTheme(targetTheme);
    showToast(`✓ Theme set to ${targetTheme}`);
  });

  // Add Note Button
  elements.addNoteBtn.addEventListener("click", createNote);

  // Profile Save Action
  elements.saveProfileBtn.addEventListener("click", () => {
    const newName = elements.profileNameInput.value.trim();
    if (newName === "") {
      showToast("Profile name cannot be empty", "error");
      return;
    }
    saveUserProfile({ name: newName });
    showToast("✓ Profile updated successfully");
    renderActiveView();
  });

  // Settings view: Theme Radios click sync
  elements.themeRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      saveTheme(e.target.value);
      showToast(`✓ Theme set to ${e.target.value}`);
    });
  });

  // Settings view: Notes Tools
  elements.downloadNotesBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    elements.downloadDropdown.classList.toggle("active");
  });

  // Close dropdown clicking outside
  document.addEventListener("click", () => {
    if (elements.downloadDropdown) {
      elements.downloadDropdown.classList.remove("active");
    }
  });

  elements.downloadDropdown.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const format = e.currentTarget.getAttribute("data-format");
      downloadNotes(format);
      elements.downloadDropdown.classList.remove("active");
    });
  });

  elements.deleteAllNotesBtn.addEventListener("click", deleteAllNotesToTrash);

  // Edit Note Modal actions
  elements.closeEditModalBtn.addEventListener("click", () => closeModal(elements.editModal));
  elements.cancelEditBtn.addEventListener("click", () => closeModal(elements.editModal));
  elements.saveEditBtn.addEventListener("click", saveEditNote);

  // Confirm Modal actions
  elements.closeConfirmModalBtn.addEventListener("click", () => {
    closeModal(elements.confirmModal);
    state.confirmCallback = null;
  });
  elements.cancelConfirmBtn.addEventListener("click", () => {
    closeModal(elements.confirmModal);
    state.confirmCallback = null;
  });
  elements.okConfirmBtn.addEventListener("click", () => {
    if (state.confirmCallback) {
      state.confirmCallback();
    }
    closeModal(elements.confirmModal);
    state.confirmCallback = null;
  });

  // Keyboard accessibility controls (Esc to close open modals)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.activeModal) {
      closeModal(state.activeModal);
    }
  });

  // Stat cards on Dashboard navigation binding
  document.querySelectorAll(".stat-card").forEach(card => {
    const targetSection = card.getAttribute("data-section");
    if (targetSection) {
      card.addEventListener("click", () => {
        navigateTo(targetSection);
      });
    }
  });
}

// --- Escape HTML characters helper to prevent XSS ---
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Initialization ---
function init() {
  cleanupTrash();
  state.notes = getNotes();
  state.profile = getUserProfile();
  state.theme = getTheme();

  applyTheme(state.theme);
  updateProfileUI();
  
  initEvents();
  
  // Set default view pane
  navigateTo("dashboard");
}

// Run application on load
window.addEventListener("DOMContentLoaded", init);