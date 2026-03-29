import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "labeled-clicks-state-v2";
  const STATE_VERSION = 2;

  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("id");
  if (!groupId) {
    window.location.href = "./index.html";
    return;
  }

  // Auth / layout DOM
  const welcomeScreen = document.getElementById("welcome-screen");
  const authHint = document.getElementById("auth-hint");
  const signInBtn = document.getElementById("sign-in-btn");
  const signOutBtn = document.getElementById("sign-out-btn");
  const appEl = document.getElementById("app");
  const authBar = document.getElementById("auth-bar");
  const authName = document.getElementById("auth-name");
  const authEmail = document.getElementById("auth-email");
  const authPhoto = document.getElementById("auth-photo");
  const authAvatarFallback = document.getElementById("auth-avatar-fallback");

  // Group hero DOM
  const groupTitleEl = document.getElementById("group-title");
  const groupDescriptionEl = document.getElementById("group-description");
  const groupCreatedEl = document.getElementById("group-created");
  const statTotal = document.getElementById("group-stat-total");
  const statWeek = document.getElementById("group-stat-week");
  const statMonth = document.getElementById("group-stat-month");
  const groupLayoutSelect = document.getElementById("group-layout-select");
  const groupSortSelect = document.getElementById("group-sort-select");
  const cardsContainer = document.getElementById("cards-container");
  const groupCoverPhoto = document.getElementById("group-cover-photo");
  const editGroupBtn = document.getElementById("edit-group-btn");

  // Edit group modal
  const editGroupModal = document.getElementById("edit-group-modal");
  const closeEditGroupModalBtn = document.getElementById("close-edit-group-modal-btn");
  const editGroupTitleInput = document.getElementById("edit-group-title-input");
  const editGroupDescriptionInput = document.getElementById("edit-group-description-input");
  const editGroupCoverInput = document.getElementById("edit-group-cover-input");
  const editGroupCoverPreview = document.getElementById("edit-group-cover-preview");
  let editGroupCoverData = "";
  const saveEditGroupBtn = document.getElementById("save-edit-group-btn");

  // Edit card modal
  const editCardModal = document.getElementById("edit-card-modal");
  const closeEditCardModalBtn = document.getElementById("close-edit-card-modal-btn");
  const editCardGroupSelect = document.getElementById("edit-card-group-select");
  const editCardTitleInput = document.getElementById("edit-card-title-input");
  const editCardTypeInput = document.getElementById("edit-card-type-input");
  const editCardDescriptionInput = document.getElementById("edit-card-description-input");
  const editCardImageInput = document.getElementById("edit-card-image-input");
  const addEditButtonBtn = document.getElementById("add-edit-button-btn");
  const editButtonNameInput = document.getElementById("edit-button-name-input");
  const editButtonTypeInput = document.getElementById("edit-button-type-input");
  const editButtonValueInput = document.getElementById("edit-button-value-input");
  const editButtonDraftList = document.getElementById("edit-button-draft-list");
  const saveEditCardBtn = document.getElementById("save-edit-card-btn");

  // Entry modal
  const entryModal = document.getElementById("entry-modal");
  const entryModalTitle = document.getElementById("entry-modal-title");
  const closeEntryModalBtn = document.getElementById("close-entry-modal-btn");
  const entrySearchInput = document.getElementById("entry-search-input");
  const copyAllEntriesBtn = document.getElementById("copy-all-entries-btn");
  const entryNewLabelInput = document.getElementById("entry-new-label-input");
  const entryList = document.getElementById("entry-list");

  // Description modal
  const descriptionModal = document.getElementById("description-modal");
  const descriptionModalTitle = document.getElementById("description-modal-title");
  const closeDescriptionModalBtn = document.getElementById("close-description-modal-btn");
  const entryDescriptionInput = document.getElementById("entry-description-input");
  const saveEntryDescriptionBtn = document.getElementById("save-entry-description-btn");

  // Image modal
  const imageModal = document.getElementById("image-modal");
  const fullscreenImage = document.getElementById("fullscreen-image");

  let auth = null;
  let db = null;
  let currentUserId = null;
  let isAppInitialized = false;
  let editDraftButtons = [];
  let activeCardIdForEdit = null;
  let activeCardIdForEntries = null;
  let activeEntryIdForDescription = null;

  let state = { version: STATE_VERSION, groups: [], cards: [] };

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  } catch (err) {
    if (authHint) {
      authHint.textContent =
        "Firebase isn't configured yet. Paste your Firebase config into firebase-config.js to enable Google login.";
      authHint.style.color = "#b45309";
    }
  }

  function nowIso() { return new Date().toISOString(); }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

  function getUserDocRef() {
    if (!db || !currentUserId) return null;
    return doc(db, "users", currentUserId);
  }

  async function loadStateFromFirestore() {
    const userDocRef = getUserDocRef();
    if (!userDocRef) {
      state = { version: STATE_VERSION, groups: [], cards: [] };
      return;
    }
    try {
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.version === STATE_VERSION && Array.isArray(data.groups) && Array.isArray(data.cards)) {
          state = data;
          return;
        }
      }
    } catch (err) {
      console.error("Error loading from Firestore:", err);
    }
    state = { version: STATE_VERSION, groups: [], cards: [] };
  }

  async function saveStateToFirestore() {
    const userDocRef = getUserDocRef();
    if (!userDocRef) return;
    state.version = STATE_VERSION;
    try {
      await setDoc(userDocRef, state);
    } catch (err) {
      console.error("Error saving to Firestore:", err);
    }
  }

  function getGroup() {
    return state.groups.find((g) => g.id === groupId) || null;
  }

  function setSignedOutUI() {
    welcomeScreen.classList.remove("hidden");
    appEl.classList.add("hidden");
    authBar.classList.add("hidden");
    authName.textContent = "Signed out";
    authEmail.textContent = "";
    authPhoto.classList.add("hidden");
    authAvatarFallback.classList.remove("hidden");
    signInBtn.classList.remove("hidden");
  }

  function setSignedInUI(user) {
    welcomeScreen.classList.add("hidden");
    appEl.classList.remove("hidden");
    authBar.classList.remove("hidden");
    authName.textContent = user.displayName || "Signed in";
    authEmail.textContent = user.email || "";
    if (user.photoURL) {
      authPhoto.src = user.photoURL;
      authPhoto.classList.remove("hidden");
      authAvatarFallback.classList.add("hidden");
    } else {
      authPhoto.classList.add("hidden");
      authAvatarFallback.classList.remove("hidden");
    }
    signInBtn.classList.add("hidden");
  }

  function initAppOnce() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    const group = getGroup();
    if (!group) {
      appEl.classList.remove("hidden");
      cardsContainer.innerHTML = `<p class="muted">Group not found. <a href="./index.html">← Go back</a>.</p>`;
      return;
    }

    groupLayoutSelect.value = group.layout || "3";
    groupSortSelect.value = group.sort || "newest";

    groupLayoutSelect.addEventListener("change", async () => {
      const g = getGroup();
      if (!g) return;
      g.layout = groupLayoutSelect.value;
      await saveStateToFirestore();
      renderGroupPage();
    });
    groupSortSelect.addEventListener("change", async () => {
      const g = getGroup();
      if (!g) return;
      g.sort = groupSortSelect.value;
      await saveStateToFirestore();
      renderGroupPage();
    });

    // Edit group modal
    editGroupBtn.addEventListener("click", openEditGroupModal);
    closeEditGroupModalBtn.addEventListener("click", closeEditGroupModal);
    saveEditGroupBtn.addEventListener("click", saveEditedGroup);
    editGroupModal.addEventListener("click", (e) => {
      if (e.target === editGroupModal) closeEditGroupModal();
    });

    // Cover photo file upload
    editGroupCoverInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        editGroupCoverData = ev.target.result;
        if (editGroupCoverPreview) {
          editGroupCoverPreview.innerHTML = `<img src="${editGroupCoverData}" style="width:100%; height:100%; object-fit:cover;">`;
        }
      };
      reader.readAsDataURL(file);
    });
    addEditButtonBtn.addEventListener("click", addEditDraftButton);
    closeEditCardModalBtn.addEventListener("click", closeEditCardModal);
    saveEditCardBtn.addEventListener("click", saveEditedCard);
    editCardModal.addEventListener("click", (e) => {
      if (e.target === editCardModal) closeEditCardModal();
    });

    // Entry modal
    closeEntryModalBtn.addEventListener("click", closeEntryModal);
    copyAllEntriesBtn.addEventListener("click", copyAllEntries);
    entryNewLabelInput.addEventListener("blur", autoSaveEntryOnBlur);
    entrySearchInput.addEventListener("input", renderEntryList);
    entryModal.addEventListener("click", (e) => {
      if (e.target === entryModal) closeEntryModal();
    });

    // Description modal
    closeDescriptionModalBtn.addEventListener("click", () => descriptionModal.classList.add("hidden"));
    saveEntryDescriptionBtn.addEventListener("click", saveEntryDescription);
    descriptionModal.addEventListener("click", (e) => {
      if (e.target === descriptionModal) descriptionModal.classList.add("hidden");
    });

    // Image modal
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) imageModal.classList.add("hidden");
    });

    renderGroupPage();
  }

  // ── Stats helpers ──────────────────────────────────────────────────────────

  function groupTotalClicks() {
    return state.cards
      .filter((c) => c.groupId === groupId)
      .reduce((sum, card) => sum + (card.clicks || 0) + (card.buttons || []).reduce((s, b) => s + (b.clickCount || 0), 0), 0);
  }

  function clicksSince(card, days) {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return card.clickHistory.filter((item) => new Date(item.at).getTime() >= threshold).length;
  }

  function groupClicksSince(days) {
    return state.cards
      .filter((c) => c.groupId === groupId)
      .reduce((sum, card) => sum + clicksSince(card, days), 0);
  }

  function sortCards(cards, mode) {
    const copy = [...cards];
    if (mode === "most") {
      copy.sort((a, b) => b.clicks - a.clicks);
    } else {
      copy.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return copy;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function renderGroupPage() {
    const group = getGroup();
    if (!group) return;

    document.title = `${group.title} — Labeled Clicks`;
    groupTitleEl.textContent = group.title;
    groupDescriptionEl.textContent = group.description || "";
    
    // Update Group Info section
    if (groupCreatedEl && group.createdAt) {
      groupCreatedEl.textContent = new Date(group.createdAt).toLocaleString();
    }
    if (statTotal) statTotal.textContent = groupTotalClicks();
    if (statWeek) statWeek.textContent = groupClicksSince(7);
    if (statMonth) statMonth.textContent = groupClicksSince(30);
    
    // Update cover photo
    if (groupCoverPhoto) {
      if (group.coverUrl) {
        groupCoverPhoto.style.backgroundImage = `url('${escapeAttribute(group.coverUrl)}')`;
      } else {
        groupCoverPhoto.style.backgroundImage = '';
        groupCoverPhoto.style.background = '#e5e7eb';
      }
    }
    
    groupLayoutSelect.value = group.layout || "3";
    groupSortSelect.value = group.sort || "newest";

    const groupCards = sortCards(
      state.cards.filter((c) => c.groupId === groupId),
      group.sort
    );
    cardsContainer.className = `cards-grid layout-${group.layout || "3"}`;
    cardsContainer.innerHTML = "";
    if (groupCards.length === 0) {
      cardsContainer.innerHTML = `<p class="muted">No cards in this group yet. <a href="./index.html">← Go back</a> to add cards.</p>`;
    } else {
      groupCards.forEach((card) => cardsContainer.appendChild(renderCard(card)));
    }
  }

  function renderCard(card) {
    const el = document.createElement("article");
    el.className = "card";
    const cardType = card.cardType || "standard";
    const isDatabaseCard = cardType === "database";
    const imageContent = card.imageUrl
      ? `<div class="card-image" style="background-image:url('${escapeAttribute(card.imageUrl)}')"></div>`
      : `<div class="card-image">${escapeHtml(card.title.charAt(0).toUpperCase())}</div>`;
    const buttonSummary = card.buttons
      .map((b) => `<span class="chip">${escapeHtml(b.name)} ${b.clickCount}</span>`)
      .join("");
    el.innerHTML = `
      ${imageContent}
      <div class="card-content">
        <div class="card-top">
          <div>
            <strong>${escapeHtml(card.title)}</strong>
            <p class="muted">Type: ${isDatabaseCard ? "Labeled Clicks" : "Standard"}</p>
            <p class="muted">${escapeHtml(card.description || "No description")}</p>
          </div>
          <button data-delete-card="${card.id}" class="inline-btn danger-btn" type="button">Delete</button>
        </div>
        <div class="stats-row muted">
          <span>Total: ${card.clicks}</span>
          <span>This week: ${clicksSince(card, 7)}</span>
          <span>This month: ${clicksSince(card, 30)}</span>
        </div>
        <div class="button-summary-row">${buttonSummary || '<span class="muted">No extra buttons</span>'}</div>
        <div class="card-action-row">
          ${isDatabaseCard ? `<button data-open-entries="${card.id}" class="inline-btn" type="button">Labeled Entries</button>` : ""}
          <button data-edit-card="${card.id}" class="inline-btn btn-secondary" type="button">Edit Card</button>
        </div>
        <div class="card-action-row" data-extra-buttons="${card.id}"></div>
      </div>
    `;

    const row = el.querySelector(`[data-extra-buttons="${card.id}"]`);
    card.buttons.forEach((button) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "additional-btn inline-btn";
      btn.textContent = button.name;
      btn.addEventListener("click", () => handleAdditionalButtonClick(card.id, button.id));
      row.appendChild(btn);
    });

    el.addEventListener("click", (event) => {
      if (event.target.closest("button, select, input, textarea, a")) return;
      registerClick(card.id, "card", "Card");
      if (isDatabaseCard) openEntryModal(card.id);
    });

    el.querySelector("[data-delete-card]").addEventListener("click", () => deleteCard(card.id));
    const openEntriesBtn = el.querySelector("[data-open-entries]");
    if (openEntriesBtn) openEntriesBtn.addEventListener("click", () => openEntryModal(card.id));
    el.querySelector("[data-edit-card]").addEventListener("click", () => openEditCardModal(card.id));
    return el;
  }

  // ── Click tracking ─────────────────────────────────────────────────────────

  async function registerClick(cardId, sourceType, sourceName) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    card.clicks += 1;
    card.updatedAt = nowIso();
    card.clickHistory.unshift({ at: nowIso(), sourceType, sourceName });
    await saveStateToFirestore();
    renderGroupPage();
    if (activeCardIdForEntries === cardId) renderEntryList();
  }

  function handleAdditionalButtonClick(cardId, buttonId) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const button = card.buttons.find((b) => b.id === buttonId);
    if (!button) return;
    button.clickCount += 1;
    registerClick(cardId, "button", button.name);
    if (button.type === "link" && button.value) window.open(button.value, "_blank", "noopener,noreferrer");
    if (button.type === "image" && button.value) {
      fullscreenImage.src = button.value;
      imageModal.classList.remove("hidden");
    }
  }

  async function deleteCard(cardId) {
    if (!confirm("Delete this card?")) return;
    state.cards = state.cards.filter((c) => c.id !== cardId);
    await saveStateToFirestore();
    renderGroupPage();
  }

  // ── Edit group modal ───────────────────────────────────────────────────────

  function openEditGroupModal() {
    const group = getGroup();
    if (!group) return;
    editGroupTitleInput.value = group.title || "";
    editGroupDescriptionInput.value = group.description || "";
    editGroupCoverData = group.coverUrl || "";
    editGroupCoverInput.value = "";
    if (editGroupCoverPreview) {
      if (group.coverUrl) {
        editGroupCoverPreview.innerHTML = `<img src="${group.coverUrl}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        editGroupCoverPreview.innerHTML = "";
      }
    }
    editGroupModal.classList.remove("hidden");
  }

  function closeEditGroupModal() {
    editGroupTitleInput.value = "";
    editGroupDescriptionInput.value = "";
    editGroupCoverData = "";
    editGroupCoverInput.value = "";
    if (editGroupCoverPreview) editGroupCoverPreview.innerHTML = "";
    editGroupModal.classList.add("hidden");
  }

  async function saveEditedGroup() {
    const group = getGroup();
    if (!group) return;
    const title = editGroupTitleInput.value.trim();
    if (!title) { alert("Group title is required."); return; }
    group.title = title;
    group.description = editGroupDescriptionInput.value.trim();
    group.coverUrl = editGroupCoverData || group.coverUrl;
    group.updatedAt = nowIso();
    await saveStateToFirestore();
    renderGroupPage();
    closeEditGroupModal();
  }

  // ── Edit card modal ────────────────────────────────────────────────────────

  function renderEditGroupOptions(selectedGroupId = "") {
    editCardGroupSelect.innerHTML = "";
    const noneOption = document.createElement("option");
    noneOption.textContent = "No group";
    noneOption.value = "";
    if (!selectedGroupId) noneOption.selected = true;
    editCardGroupSelect.appendChild(noneOption);
    state.groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.title;
      if (group.id === selectedGroupId) option.selected = true;
      editCardGroupSelect.appendChild(option);
    });
  }

  function addEditDraftButton() {
    const name = editButtonNameInput.value.trim();
    const type = editButtonTypeInput.value;
    const value = editButtonValueInput.value.trim();
    if (!name) { alert("Button name is required."); return; }
    if ((type === "link" || type === "image") && !value) {
      alert("Please add a URL value for link/image button.");
      return;
    }
    editDraftButtons.push({ id: uid("btn"), name, type, value, clickCount: 0 });
    editButtonNameInput.value = "";
    editButtonValueInput.value = "";
    renderEditDraftButtons();
  }

  function removeEditDraftButton(buttonId) {
    editDraftButtons = editDraftButtons.filter((x) => x.id !== buttonId);
    renderEditDraftButtons();
  }

  function renderEditDraftButtons() {
    editButtonDraftList.innerHTML = "";
    editDraftButtons.forEach((btn) => {
      const li = document.createElement("li");
      li.className = "chip-row";
      li.innerHTML = `
        <span class="chip">${escapeHtml(btn.name)} (${escapeHtml(btn.type)})</span>
        <button class="inline-btn danger-btn" data-remove-edit-draft-id="${btn.id}" type="button">Remove</button>
      `;
      editButtonDraftList.appendChild(li);
    });
    editButtonDraftList.querySelectorAll("[data-remove-edit-draft-id]").forEach((el) => {
      el.addEventListener("click", () => removeEditDraftButton(el.getAttribute("data-remove-edit-draft-id")));
    });
  }

  function openEditCardModal(cardId) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    activeCardIdForEdit = card.id;
    renderEditGroupOptions(card.groupId);
    editCardTitleInput.value = card.title || "";
    editCardTypeInput.value = card.cardType || "standard";
    editCardDescriptionInput.value = card.description || "";
    editCardImageInput.value = card.imageUrl || "";
    editDraftButtons = (card.buttons || []).map((button) => ({
      id: button.id || uid("btn"),
      name: button.name || "",
      type: button.type || "label",
      value: button.value || "",
      clickCount: Number(button.clickCount || 0),
    }));
    editButtonNameInput.value = "";
    editButtonTypeInput.value = "label";
    editButtonValueInput.value = "";
    renderEditDraftButtons();
    editCardModal.classList.remove("hidden");
  }

  function closeEditCardModal() {
    activeCardIdForEdit = null;
    editDraftButtons = [];
    editButtonNameInput.value = "";
    editButtonTypeInput.value = "label";
    editButtonValueInput.value = "";
    editCardModal.classList.add("hidden");
  }

  async function saveEditedCard() {
    const card = state.cards.find((c) => c.id === activeCardIdForEdit);
    if (!card) return;
    const newGroupId = editCardGroupSelect.value;
    const title = editCardTitleInput.value.trim();
    if (!title) { alert("Card title is required."); return; }
    card.groupId = newGroupId || null;
    card.title = title;
    card.cardType = editCardTypeInput.value;
    card.description = editCardDescriptionInput.value.trim();
    card.imageUrl = editCardImageInput.value.trim();
    card.buttons = editDraftButtons.map((button) => ({ ...button }));
    card.updatedAt = nowIso();
    await saveStateToFirestore();
    renderGroupPage();
    closeEditCardModal();
  }

  // ── Entry modal ────────────────────────────────────────────────────────────

  function openEntryModal(cardId) {
    activeCardIdForEntries = cardId;
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    entryModalTitle.textContent = `Labeled Entries: ${card.title}`;
    entrySearchInput.value = "";
    entryNewLabelInput.value = "";
    entryModal.classList.remove("hidden");
    renderEntryList();
  }

  function closeEntryModal() {
    autoSaveEntryOnBlur();
    entryModal.classList.add("hidden");
    activeCardIdForEntries = null;
    entryList.innerHTML = "";
  }

  async function autoSaveEntryOnBlur() {
    if (!activeCardIdForEntries) return;
    const label = entryNewLabelInput.value.trim();
    if (!label) return;
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    card.entries.unshift({
      id: uid("entry"),
      number: card.entries.length + 1,
      label,
      createdAt: nowIso(),
      description: "",
    });
    card.updatedAt = nowIso();
    entryNewLabelInput.value = "";
    await saveStateToFirestore();
    renderEntryList();
    renderGroupPage();
  }

  function renderEntryList() {
    if (!activeCardIdForEntries) return;
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const q = entrySearchInput.value.trim().toLowerCase();
    const entries = card.entries.filter((e) => e.label.toLowerCase().includes(q));
    entryList.innerHTML = "";
    if (entries.length === 0) {
      entryList.innerHTML = `<p class="muted">No entries found.</p>`;
      return;
    }
    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "entry-row";
      row.innerHTML = `
        <div class="entry-row-header">
          <strong>${entry.number}. ${escapeHtml(entry.label)}</strong>
          <span class="muted">${new Date(entry.createdAt).toLocaleString()}</span>
        </div>
        <div class="entry-row-actions">
          <button data-copy-entry="${entry.id}" class="inline-btn" type="button">Copy</button>
          <button data-delete-entry="${entry.id}" class="inline-btn danger-btn" type="button">Delete</button>
          <button data-edit-entry-desc="${entry.id}" class="inline-btn btn-secondary" type="button">Description</button>
        </div>
      `;
      entryList.appendChild(row);
    });
    entryList.querySelectorAll("[data-copy-entry]").forEach((el) => {
      el.addEventListener("click", () => copySingleEntry(el.getAttribute("data-copy-entry")));
    });
    entryList.querySelectorAll("[data-delete-entry]").forEach((el) => {
      el.addEventListener("click", () => deleteEntry(el.getAttribute("data-delete-entry")));
    });
    entryList.querySelectorAll("[data-edit-entry-desc]").forEach((el) => {
      el.addEventListener("click", () => openDescriptionModal(el.getAttribute("data-edit-entry-desc")));
    });
  }

  function renumberEntries(card) {
    card.entries.forEach((entry, idx) => { entry.number = idx + 1; });
  }

  async function deleteEntry(entryId) {
    if (!activeCardIdForEntries) return;
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    card.entries = card.entries.filter((e) => e.id !== entryId);
    renumberEntries(card);
    await saveStateToFirestore();
    renderEntryList();
  }

  async function copySingleEntry(entryId) {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === entryId);
    if (!entry) return;
    await navigator.clipboard.writeText(`${entry.number}. ${entry.label} - ${new Date(entry.createdAt).toLocaleString()}`);
  }

  async function copyAllEntries() {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const text = card.entries
      .map((e) => `${e.number}. ${e.label} - ${new Date(e.createdAt).toLocaleString()}`)
      .join("\n");
    await navigator.clipboard.writeText(text || "");
  }

  // ── Description modal ──────────────────────────────────────────────────────

  function openDescriptionModal(entryId) {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === entryId);
    if (!entry) return;
    activeEntryIdForDescription = entry.id;
    descriptionModalTitle.textContent = `Description: ${entry.number}. ${entry.label}`;
    entryDescriptionInput.value = entry.description || "";
    descriptionModal.classList.remove("hidden");
  }

  async function saveEntryDescription() {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === activeEntryIdForDescription);
    if (!entry) return;
    entry.description = entryDescriptionInput.value;
    await saveStateToFirestore();
    descriptionModal.classList.add("hidden");
  }

  // ── Escape helpers ─────────────────────────────────────────────────────────

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(text) {
    return escapeHtml(text).replaceAll("`", "");
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  if (auth) {
    const provider = new GoogleAuthProvider();
    signInBtn.addEventListener("click", async () => {
      authHint.textContent = "";
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        authHint.textContent = err?.message || "Sign-in failed. Please try again.";
        authHint.style.color = "#b91c1c";
      }
    });
    signOutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (err) {
        authHint.textContent = err?.message || "Sign-out failed.";
        authHint.style.color = "#b91c1c";
      }
    });
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUserId = user.uid;
        await loadStateFromFirestore();
        setSignedInUI(user);
        initAppOnce();
      } else {
        currentUserId = null;
        state = { version: STATE_VERSION, groups: [], cards: [] };
        setSignedOutUI();
      }
    });
  } else {
    setSignedOutUI();
    signInBtn.addEventListener("click", () => {
      authHint.textContent =
        "Firebase isn't configured yet. Add your Firebase config first, then reload.";
      authHint.style.color = "#b45309";
    });
  }
});
