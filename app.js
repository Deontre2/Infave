import { firebaseConfig } from "./firebase-config.js";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(reg => console.log('Service Worker registered'))
    .catch(err => console.log('Service Worker registration failed:', err));
}

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
  collection,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "labeled-clicks-state-v2";
  const LEGACY_KEY = "cards";
  const STATE_VERSION = 2;

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

  const groupTitleInput = document.getElementById("group-title-input");
  const groupDescriptionInput = document.getElementById("group-description-input");
  const createGroupBtn = document.getElementById("create-group-btn");
  const openCreateGroupModalBtn = document.getElementById("open-create-group-modal-btn");
  const closeCreateGroupModalBtn = document.getElementById("close-create-group-modal-btn");
  const createGroupModal = document.getElementById("create-group-modal");
  const cardGroupSelect = document.getElementById("card-group-select");
  const cardTitleInput = document.getElementById("card-title-input");
  const cardTypeInput = document.getElementById("card-type-input");
  const cardDescriptionInput = document.getElementById("card-description-input");
  const cardImageInput = document.getElementById("card-image-input");
  const cardImagePreview = document.getElementById("card-image-preview");
  let cardImageData = "";
  const createCardBtn = document.getElementById("create-card-btn");
  const openCreateCardModalBtn = document.getElementById("open-create-card-modal-btn");
  const closeCreateCardModalBtn = document.getElementById("close-create-card-modal-btn");
  const createCardModal = document.getElementById("create-card-modal");
  const addButtonBtn = document.getElementById("add-button-btn");
  const buttonNameInput = document.getElementById("button-name-input");
  const buttonTypeInput = document.getElementById("button-type-input");
  const buttonValueInput = document.getElementById("button-value-input");
  const buttonDraftList = document.getElementById("button-draft-list");
  const cardContextMenu = document.getElementById("card-context-menu");
  const contextEditCardBtn = document.getElementById("context-edit-card");
  const contextDeleteCardBtn = document.getElementById("context-delete-card");
  const closeEditCardModalBtn = document.getElementById("close-edit-card-modal-btn");
  const editCardModal = document.getElementById("edit-card-modal");
  const editCardGroupSelect = document.getElementById("edit-card-group-select");
  const editCardTotalClicks = document.getElementById("edit-card-total-clicks");
  const editCardWeekClicks = document.getElementById("edit-card-week-clicks");
  const editCardMonthClicks = document.getElementById("edit-card-month-clicks");
  const editCardCreated = document.getElementById("edit-card-created");
  const editCardTitleInput = document.getElementById("edit-card-title-input");
  const editCardTypeInput = document.getElementById("edit-card-type-input");
  const editCardDescriptionInput = document.getElementById("edit-card-description-input");
  const editCardImageInput = document.getElementById("edit-card-image-input");
  const editCardImagePreview = document.getElementById("edit-card-image-preview");
  let editCardImageData = ""
  const addEditButtonBtn = document.getElementById("add-edit-button-btn");
  const editButtonNameInput = document.getElementById("edit-button-name-input");
  const editButtonTypeInput = document.getElementById("edit-button-type-input");
  const editButtonValueInput = document.getElementById("edit-button-value-input");
  const editButtonDraftList = document.getElementById("edit-button-draft-list");
  const saveEditCardBtn = document.getElementById("save-edit-card-btn");
  const groupsContainer = document.getElementById("groups-container");
  const entryModal = document.getElementById("entry-modal");
  const entryModalTitle = document.getElementById("entry-modal-title");
  const closeEntryModalBtn = document.getElementById("close-entry-modal-btn");
  const entrySearchInput = document.getElementById("entry-search-input");
  const copyAllEntriesBtn = document.getElementById("copy-all-entries-btn");
  const entryNewLabelInput = document.getElementById("entry-new-label-input");
  const entryList = document.getElementById("entry-list");

  const descriptionModal = document.getElementById("description-modal");
  const descriptionModalTitle = document.getElementById("description-modal-title");
  const closeDescriptionModalBtn = document.getElementById("close-description-modal-btn");
  const entryDescriptionInput = document.getElementById("entry-description-input");
  const saveEntryDescriptionBtn = document.getElementById("save-entry-description-btn");
  const entryButtonStats = document.getElementById("entry-button-stats");

  const imageModal = document.getElementById("image-modal");
  const fullscreenImage = document.getElementById("fullscreen-image");

  let auth = null;
  let db = null;
  let currentUserId = null;
  let isAppInitialized = false;
  let draftButtons = [];
  let editDraftButtons = [];
  let activeCardIdForEdit = null;
  let activeCardIdForEntries = null;
  let activeEntryIdForDescription = null;

  let state = defaultState();

  function defaultState() {
    return { version: STATE_VERSION, groups: [], cards: [] };
  }

  function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  } catch (err) {
    authHint.textContent =
      "Firebase isn't configured yet. Paste your Firebase config into firebase-config.js to enable Google login.";
    authHint.style.color = "#b45309";
  }

  function getUserDocRef() {
    if (!db || !currentUserId) return null;
    return doc(db, "users", currentUserId);
  }

  async function loadStateFromFirestore() {
    const userDocRef = getUserDocRef();
    if (!userDocRef) {
      state = defaultState();
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
    state = defaultState();
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

  function initAppOnce() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    createGroupBtn.addEventListener("click", createGroup);
    openCreateGroupModalBtn.addEventListener("click", () => createGroupModal.classList.remove("hidden"));
    closeCreateGroupModalBtn.addEventListener("click", () => createGroupModal.classList.add("hidden"));
    addButtonBtn.addEventListener("click", addDraftButton);
    createCardBtn.addEventListener("click", createCard);
    openCreateCardModalBtn.addEventListener("click", () => createCardModal.classList.remove("hidden"));
    closeCreateCardModalBtn.addEventListener("click", () => createCardModal.classList.add("hidden"));

    // Card image file upload for Create Card
    cardImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        cardImageData = ev.target.result;
        if (cardImagePreview) {
          cardImagePreview.innerHTML = `<img src="${cardImageData}" style="width:100%; height:100%; object-fit:cover;">`;
        }
      };
      reader.readAsDataURL(file);
    });
    addEditButtonBtn.addEventListener("click", addEditDraftButton);

    // Card image file upload
    editCardImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        editCardImageData = ev.target.result;
        if (editCardImagePreview) {
          editCardImagePreview.innerHTML = `<img src="${editCardImageData}" style="width:100%; height:100%; object-fit:cover;">`;
        }
      };
      reader.readAsDataURL(file);
    });
    closeEditCardModalBtn.addEventListener("click", closeEditCardModal);
    saveEditCardBtn.addEventListener("click", saveEditedCard);
    closeEntryModalBtn.addEventListener("click", closeEntryModal);
    closeDescriptionModalBtn.addEventListener("click", () => descriptionModal.classList.add("hidden"));
    saveEntryDescriptionBtn.addEventListener("click", saveEntryDescription);
    copyAllEntriesBtn.addEventListener("click", copyAllEntries);
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) {
        imageModal.classList.add("hidden");
      }
    });
    createGroupModal.addEventListener("click", (e) => {
      if (e.target === createGroupModal) {
        createGroupModal.classList.add("hidden");
      }
    });
    createCardModal.addEventListener("click", (e) => {
      if (e.target === createCardModal) {
        createCardModal.classList.add("hidden");
      }
    });
    editCardModal.addEventListener("click", (e) => {
      if (e.target === editCardModal) {
        closeEditCardModal();
      }
    });

    // Context menu listeners
    contextEditCardBtn.addEventListener("click", () => {
      if (activeCardIdForContext) {
        cardContextMenu.classList.add("hidden");
        openEditCardModal(activeCardIdForContext);
        activeCardIdForContext = null;
      }
    });
    contextDeleteCardBtn.addEventListener("click", () => {
      if (activeCardIdForContext) {
        cardContextMenu.classList.add("hidden");
        deleteCard(activeCardIdForContext);
        activeCardIdForContext = null;
      }
    });
    cardContextMenu.addEventListener("click", (e) => {
      if (e.target === cardContextMenu) {
        cardContextMenu.classList.add("hidden");
        activeCardIdForContext = null;
      }
    });

    entryNewLabelInput.addEventListener("blur", autoSaveEntryOnBlur);
    entrySearchInput.addEventListener("input", renderEntryList);

    renderAll();
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
    openCreateGroupModalBtn.classList.add("hidden");
    openCreateCardModalBtn.classList.add("hidden");
  }

  function setSignedInUI(user) {
    welcomeScreen.classList.add("hidden");
    appEl.classList.remove("hidden");
    authBar.classList.remove("hidden");
    signInBtn.classList.add("hidden");
    openCreateGroupModalBtn.classList.remove("hidden");
    openCreateCardModalBtn.classList.remove("hidden");

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
  }

  function renderAll() {
    renderGroupOptions();
    renderDraftButtons();
    renderGroups();
  }

  async function createGroup() {
    const title = groupTitleInput.value.trim() || "Untitled Group";
    const description = groupDescriptionInput.value.trim();
    state.groups.unshift({
      id: uid("group"),
      title,
      description,
      layout: "3",
      sort: "newest",
      createdAt: nowIso(),
    });
    groupTitleInput.value = "";
    groupDescriptionInput.value = "";
    await saveStateToFirestore();
    renderAll();
    createGroupModal.classList.add("hidden");
  }

  function renderGroupOptions() {
    cardGroupSelect.innerHTML = "";
    const noneOption = document.createElement("option");
    noneOption.textContent = "No group";
    noneOption.value = "";
    cardGroupSelect.appendChild(noneOption);
    if (state.groups.length === 0) {
      return;
    }
    state.groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.title;
      cardGroupSelect.appendChild(option);
    });
  }

  function addDraftButton() {
    const name = buttonNameInput.value.trim();
    const type = buttonTypeInput.value;
    const value = buttonValueInput.value.trim();
    if (!name) {
      alert("Button name is required.");
      return;
    }
    if ((type === "link" || type === "image") && !value) {
      alert("Please add a URL value for link/image button.");
      return;
    }
    draftButtons.push({
      id: uid("btn"),
      name,
      type,
      value,
      clickCount: 0,
    });
    buttonNameInput.value = "";
    buttonValueInput.value = "";
    renderDraftButtons();
  }

  function removeDraftButton(buttonId) {
    draftButtons = draftButtons.filter((x) => x.id !== buttonId);
    renderDraftButtons();
  }

  function renderDraftButtons() {
    buttonDraftList.innerHTML = "";
    draftButtons.forEach((btn) => {
      const li = document.createElement("li");
      li.className = "chip-row";
      li.innerHTML = `
        <span class="chip">${btn.name} (${btn.type})</span>
        <button class="inline-btn danger-btn" data-remove-draft-id="${btn.id}" type="button">Remove</button>
      `;
      buttonDraftList.appendChild(li);
    });
    buttonDraftList.querySelectorAll("[data-remove-draft-id]").forEach((el) => {
      el.addEventListener("click", () => removeDraftButton(el.getAttribute("data-remove-draft-id")));
    });
  }

  function renderEditGroupOptions(selectedGroupId = "") {
    editCardGroupSelect.innerHTML = "";
    const noneOption = document.createElement("option");
    noneOption.textContent = "No group";
    noneOption.value = "";
    if (!selectedGroupId) {
      noneOption.selected = true;
    }
    editCardGroupSelect.appendChild(noneOption);
    if (state.groups.length === 0) {
      return;
    }
    state.groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.title;
      if (group.id === selectedGroupId) {
        option.selected = true;
      }
      editCardGroupSelect.appendChild(option);
    });
  }

  function addEditDraftButton() {
    const name = editButtonNameInput.value.trim();
    const type = editButtonTypeInput.value;
    const value = editButtonValueInput.value.trim();
    if (!name) {
      alert("Button name is required.");
      return;
    }
    if ((type === "link" || type === "image") && !value) {
      alert("Please add a URL value for link/image button.");
      return;
    }
    editDraftButtons.push({
      id: uid("btn"),
      name,
      type,
      value,
      clickCount: 0,
    });
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
    editCardImageData = "";
    renderEditGroupOptions(card.groupId);
    editCardTitleInput.value = card.title || "";
    editCardTypeInput.value = card.cardType || "standard";
    editCardDescriptionInput.value = card.description || "";
    if (editCardImagePreview) {
      if (card.imageUrl) {
        editCardImagePreview.innerHTML = `<img src="${card.imageUrl}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        editCardImagePreview.innerHTML = "";
      }
    }
    const totalClicks = (card.clicks || 0) + card.buttons.reduce((sum, b) => sum + (b.clickCount || 0), 0);
    if (editCardTotalClicks) editCardTotalClicks.textContent = totalClicks.toString();
    if (editCardWeekClicks) editCardWeekClicks.textContent = clicksSince(card, 7).toString();
    if (editCardMonthClicks) editCardMonthClicks.textContent = clicksSince(card, 30).toString();
    if (editCardCreated && card.createdAt) editCardCreated.textContent = new Date(card.createdAt).toLocaleString();
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
    const groupId = editCardGroupSelect.value;
    const title = editCardTitleInput.value.trim();
    if (!title) {
      alert("Card title is required.");
      return;
    }

    card.groupId = groupId || null;
    card.title = title;
    card.cardType = editCardTypeInput.value;
    card.description = editCardDescriptionInput.value.trim();
    card.imageUrl = editCardImageData || card.imageUrl;
    card.buttons = editDraftButtons.map((button) => ({ ...button }));
    card.updatedAt = nowIso();

    await saveStateToFirestore();
    renderAll();
    closeEditCardModal();
  }

  async function createCard() {
    const groupId = cardGroupSelect.value;
    const title = cardTitleInput.value.trim();
    const cardType = cardTypeInput.value;
    if (!title) {
      alert("Card title is required.");
      return;
    }
    state.cards.unshift({
      id: uid("card"),
      groupId: groupId || null,
      title,
      cardType,
      description: cardDescriptionInput.value.trim(),
      imageUrl: cardImageData,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      clicks: 0,
      clickHistory: [],
      buttons: draftButtons,
      entries: [],
    });
    draftButtons = [];
    cardTitleInput.value = "";
    cardTypeInput.value = "standard";
    cardDescriptionInput.value = "";
    cardImageInput.value = "";
    cardImageData = "";
    if (cardImagePreview) cardImagePreview.innerHTML = "";
    await saveStateToFirestore();
    renderAll();
    createCardModal.classList.add("hidden");
  }

  async function deleteGroup(groupId) {
    state.groups = state.groups.filter((g) => g.id !== groupId);
    state.cards = state.cards.filter((c) => c.groupId !== groupId);
    await saveStateToFirestore();
    renderAll();
  }

  async function deleteCard(cardId) {
    state.cards = state.cards.filter((c) => c.id !== cardId);
    await saveStateToFirestore();
    renderAll();
  }

  async function updateGroupSetting(groupId, patch) {
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return;
    Object.assign(group, patch);
    await saveStateToFirestore();
    renderAll();
  }


  function groupTotalClicks(groupId) {
    return state.cards
      .filter((c) => c.groupId === groupId)
      .reduce((sum, card) => sum + card.clicks + card.buttons.reduce((s, b) => s + b.clickCount, 0), 0);
  }

  function clicksSince(card, days) {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return card.clickHistory.filter((item) => new Date(item.at).getTime() >= threshold).length;
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

  function renderGroups() {
    groupsContainer.innerHTML = "";
    const ungroupedCards = state.cards.filter((c) => !c.groupId);
    if (state.groups.length === 0 && ungroupedCards.length === 0) {
      groupsContainer.innerHTML = `<p class="muted">No groups or ungrouped cards yet. Create your first card.</p>`;
      return;
    }

    if (ungroupedCards.length > 0) {
      const cardsGrid = document.createElement("div");
      cardsGrid.className = "cards-grid layout-3";
      ungroupedCards.forEach((card) => cardsGrid.appendChild(renderCard(card)));
      groupsContainer.appendChild(cardsGrid);
    }
    const listEl = document.createElement("div");
    listEl.className = "group-list";
    listEl.innerHTML = `<h3>Groups</h3>`;
    if (state.groups.length === 0) {
      listEl.innerHTML += `<p class="muted">No groups yet. Create one to organize cards.</p>`;
    } else {
      state.groups.forEach((group) => {
        const row = document.createElement("article");
        row.className = "card group-card";
        row.setAttribute("data-open-group", group.id);
        row.innerHTML = `
          <div class="card-content">
            <div class="card-top">
              <strong>${escapeHtml(group.title)}</strong>
              <p class="muted">${escapeHtml(group.description || "No description")}</p>
              <p class="muted stats-horizontal"><span>Week: ${groupClicksSince(group.id, 7)}</span> | <span>Month: ${groupClicksSince(group.id, 30)}</span></p>
            </div>
            <div class="group-card-actions">
              <button data-delete-group="${group.id}" class="inline-btn danger-btn" type="button">Del</button>
            </div>
          </div>
        `;
        listEl.appendChild(row);
      });
    }
    groupsContainer.appendChild(listEl);

    groupsContainer.querySelectorAll("[data-delete-group]").forEach((el) => {
      el.addEventListener("click", () => deleteGroup(el.getAttribute("data-delete-group")));
    });
    groupsContainer.querySelectorAll("[data-open-group]").forEach((el) => {
      el.addEventListener("click", (event) => {
        if (event.target.closest("button, select, input, textarea, a")) return;
        window.location.href = `./group.html?id=${el.getAttribute("data-open-group")}`;
      });
    });
  }

  function groupClicksSince(groupId, days) {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return state.cards
      .filter((c) => c.groupId === groupId)
      .reduce((sum, card) => sum + card.clickHistory.filter((item) => new Date(item.at).getTime() >= threshold).length, 0);
  }

  let longPressTimer;
  let activeCardIdForContext = null;

  function renderCard(card) {
    const el = document.createElement("article");
    el.className = "card";
    el.setAttribute("data-card-id", card.id);
    const cardType = card.cardType || "standard";
    const isDatabaseCard = cardType === "database";
    const imageContent = card.imageUrl
      ? `<div class="card-image" style="background-image:url('${escapeAttribute(card.imageUrl)}')"></div>`
      : `<div class="card-image">${escapeHtml(card.title.charAt(0).toUpperCase())}</div>`;
    const buttonChips = card.buttons.map((b) => `<span class="chip">${escapeHtml(b.name)} ${b.clickCount}</span>`).join("");
    const entryCount = (card.entries || []).length;
    const mainCount = isDatabaseCard ? `Entries ${entryCount}` : `Card ${card.clicks}`;
    const allClicksRow = `<span class="chip">${mainCount}</span>${buttonChips}`;
    el.innerHTML = `
      ${imageContent}
      <div class="card-content">
        <div class="card-top">
          <div>
            <strong>${escapeHtml(card.title)}</strong>
            <p class="muted">Type: ${isDatabaseCard ? "Labeled Clicks" : "Standard"}</p>
            <p class="muted">${escapeHtml(card.description || "No description")}</p>
          </div>
        </div>
        <div class="button-summary-row">${allClicksRow || '<span class="muted">No clicks</span>'}</div>
        <div class="card-action-row">
          ${isDatabaseCard ? `<button data-open-entries="${card.id}" class="inline-btn" type="button">Labeled Entries</button>` : ""}
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

    // Click for labeled entries (database cards only)
    el.addEventListener("click", (event) => {
      if (event.target.closest("button, select, input, textarea, a")) return;
      registerClick(card.id, "card", "Card");
      if (isDatabaseCard) {
        openEntryModal(card.id);
      }
    });

    // Press and hold for context menu
    const startLongPress = (e) => {
      if (e.target.closest("button, select, input, textarea, a")) return;
      longPressTimer = setTimeout(() => {
        activeCardIdForContext = card.id;
        cardContextMenu.classList.remove("hidden");
      }, 500); // 500ms for long press
    };
    const cancelLongPress = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    el.addEventListener("mousedown", startLongPress);
    el.addEventListener("touchstart", startLongPress, { passive: true });
    el.addEventListener("mouseup", cancelLongPress);
    el.addEventListener("mouseleave", cancelLongPress);
    el.addEventListener("touchend", cancelLongPress);
    el.addEventListener("touchcancel", cancelLongPress);

    const openEntriesBtn = el.querySelector("[data-open-entries]");
    if (openEntriesBtn) {
      openEntriesBtn.addEventListener("click", () => openEntryModal(card.id));
    }
    return el;
  }

  async function registerClick(cardId, sourceType, sourceName) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    // Only increment card.clicks for card body clicks, not button clicks
    if (sourceType === "card") {
      card.clicks += 1;
    }
    card.updatedAt = nowIso();
    card.clickHistory.unshift({ at: nowIso(), sourceType, sourceName });
    await saveStateToFirestore();
    renderGroups();
    if (activeCardIdForEntries === cardId) renderEntryList();
  }

  function handleAdditionalButtonClick(cardId, buttonId) {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const button = card.buttons.find((b) => b.id === buttonId);
    if (!button) return;

    button.clickCount += 1;
    // Track button click separately in history but don't increment card.clicks
    registerClick(cardId, "button", button.name);

    if (button.type === "link" && button.value) {
      window.open(button.value, "_blank", "noopener,noreferrer");
    }
    if (button.type === "image" && button.value) {
      fullscreenImage.src = button.value;
      imageModal.classList.remove("hidden");
    }
  }

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
      buttons: [],
    });
    card.updatedAt = nowIso();
    entryNewLabelInput.value = "";
    await saveStateToFirestore();
    renderEntryList();
    renderGroups();
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
      const entryButtons = (entry.buttons || []).map((b, idx) =>
        `<button class="inline-btn chip" data-entry-btn="${entry.id}" data-btn-idx="${idx}" type="button">${escapeHtml(b.name)} ${b.clickCount || 0}</button>`
      ).join("");
      const row = document.createElement("div");
      row.className = "entry-row";
      row.innerHTML = `
        <div class="entry-row-header">
          <strong>${entry.number}. ${escapeHtml(entry.label)}</strong>
          <span class="muted">${new Date(entry.createdAt).toLocaleString()}</span>
        </div>
        <div class="entry-row-actions">
          ${entryButtons}
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
    entryList.querySelectorAll("[data-entry-btn]").forEach((el) => {
      el.addEventListener("click", () => {
        const entryId = el.getAttribute("data-entry-btn");
        const btnIdx = parseInt(el.getAttribute("data-btn-idx"), 10);
        registerEntryButtonClick(entryId, btnIdx);
      });
    });
  }

  function renumberEntries(card) {
    card.entries.forEach((entry, idx) => {
      entry.number = idx + 1;
    });
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
    const text = `${entry.number}. ${entry.label} - ${new Date(entry.createdAt).toLocaleString()}`;
    await navigator.clipboard.writeText(text);
  }

  async function copyAllEntries() {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const text = card.entries
      .map((e) => `${e.number}. ${e.label} - ${new Date(e.createdAt).toLocaleString()}`)
      .join("\n");
    await navigator.clipboard.writeText(text || "");
  }

  function openDescriptionModal(entryId) {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === entryId);
    if (!entry) return;
    activeEntryIdForDescription = entry.id;
    descriptionModalTitle.textContent = `Description: ${entry.number}. ${entry.label}`;
    entryDescriptionInput.value = entry.description || "";
    
    // Display entry button stats
    const buttonsHtml = (entry.buttons || []).map((b, idx) => 
      `<span class="chip">${escapeHtml(b.name)}: ${b.clickCount || 0}</span>`
    ).join("");
    entryButtonStats.innerHTML = `
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
        <strong>Buttons:</strong>
        ${buttonsHtml || '<span class="muted">No buttons yet</span>'}
      </div>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <input type="text" id="new-entry-btn-name" placeholder="Button name..." style="flex:1; padding:4px 8px;">
        <button id="add-entry-btn" class="inline-btn" type="button">Add Button</button>
      </div>
    `;
    
    descriptionModal.classList.remove("hidden");
    
    // Add event listener for adding new button
    setTimeout(() => {
      const addBtn = document.getElementById("add-entry-btn");
      if (addBtn) {
        addBtn.addEventListener("click", () => {
          const input = document.getElementById("new-entry-btn-name");
          const name = input?.value?.trim();
          if (name) {
            addEntryButton(entryId, name);
            input.value = "";
            // Refresh the modal display
            openDescriptionModal(entryId);
          }
        });
      }
    }, 0);
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

  // Entry button functions
  async function registerEntryButtonClick(entryId, buttonIndex) {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === entryId);
    if (!entry || !entry.buttons || !entry.buttons[buttonIndex]) return;
    entry.buttons[buttonIndex].clickCount = (entry.buttons[buttonIndex].clickCount || 0) + 1;
    await saveStateToFirestore();
    renderEntryList();
  }

  async function addEntryButton(entryId, buttonName) {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === entryId);
    if (!entry) return;
    if (!entry.buttons) entry.buttons = [];
    entry.buttons.push({
      id: uid("entry-btn"),
      name: buttonName,
      clickCount: 0,
    });
    await saveStateToFirestore();
    renderEntryList();
  }

  async function removeEntryButton(entryId, buttonIndex) {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === entryId);
    if (!entry || !entry.buttons) return;
    entry.buttons.splice(buttonIndex, 1);
    await saveStateToFirestore();
    renderEntryList();
  }

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
        state = defaultState();
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

