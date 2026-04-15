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
  const loadingScreen = document.getElementById("loading-screen");

  // Group hero DOM
  const groupTitleEl = document.getElementById("group-title");
  const groupDescriptionEl = document.getElementById("group-description");
  const groupCreatedEl = document.getElementById("group-created");
  const statTotal = document.getElementById("group-stat-total");
  const statWeek = document.getElementById("group-stat-week");
  const statMonth = document.getElementById("group-stat-month");
  const statCards = document.getElementById("group-stat-cards");
  const statEntries = document.getElementById("group-stat-entries");
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
  const editGroupClickLimitInput = document.getElementById("edit-group-click-limit-input");
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
  const editCardImagePreview = document.getElementById("edit-card-image-preview");
  let editCardImageData = "";
  const editCardClickLimitInput = document.getElementById("edit-card-click-limit-input");
  const editCardTotalClicks = document.getElementById("edit-card-total-clicks");
  const editCardWeekClicks = document.getElementById("edit-card-week-clicks");
  const editCardMonthClicks = document.getElementById("edit-card-month-clicks");
  const editCardCreated = document.getElementById("edit-card-created");
  const editCardButtonStats = document.getElementById("edit-card-button-stats");
  const editCardClicksRow = document.getElementById("edit-card-clicks-row");
  const editCardWeekRow = document.getElementById("edit-card-week-row");
  const editCardMonthRow = document.getElementById("edit-card-month-row");
  const editCardEntriesRow = document.getElementById("edit-card-entries-row");
  const editCardEntriesCount = document.getElementById("edit-card-entries-count");
  const addEditButtonModal = document.getElementById("add-edit-button-modal");
  const openAddEditButtonModalBtn = document.getElementById("open-add-edit-button-modal-btn");
  const editButtonLinkGroup = document.getElementById("edit-button-link-group");
  const editButtonImageGroup = document.getElementById("edit-button-image-group");
  const addEditButtonBtn = document.getElementById("add-edit-button-btn");
  const editButtonNameInput = document.getElementById("edit-button-name-input");
  const editButtonTypeInput = document.getElementById("edit-button-type-input");
  const editButtonValueInput = document.getElementById("edit-button-value-input");
  const editButtonImageInput = document.getElementById("edit-button-image-input");
  const editButtonImagePreview = document.getElementById("edit-button-image-preview");
  let editButtonImageData = "";
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

  // Card context menu
  const cardContextMenu = document.getElementById("card-context-menu");

  // Search DOM
  const searchBar = document.getElementById("search-bar");
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  let currentSearchQuery = "";

  let auth = null;
  let db = null;
  let currentUserId = null;
  let isAppInitialized = false;
  let editDraftButtons = [];
  let activeCardIdForEdit = null;
  let activeCardIdForEntries = null;
  let activeEntryIdForDescription = null;
  let longPressTimer = null;
  let activeCardIdForContext = null;

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

  function setLoadingUI() {
    welcomeScreen.classList.add("hidden");
    appEl.classList.add("hidden");
    authBar.classList.add("hidden");
    signInBtn.classList.add("hidden");
    if (loadingScreen) loadingScreen.classList.remove("hidden");
  }

  function setSignedOutUI() {
    if (loadingScreen) loadingScreen.classList.add("hidden");
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
    if (loadingScreen) loadingScreen.classList.add("hidden");
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
    searchBar.classList.remove("hidden");
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
    editGroupBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      openEditGroupModal();
    }, { passive: false });
    
    closeEditGroupModalBtn.addEventListener("click", closeEditGroupModal);
    closeEditGroupModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeEditGroupModal();
    }, { passive: false });
    
    saveEditGroupBtn.addEventListener("click", saveEditedGroup);
    saveEditGroupBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      saveEditedGroup();
    }, { passive: false });
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
    addEditButtonBtn.addEventListener("click", () => {
      addEditDraftButton();
      addEditButtonModal.classList.add("hidden");
    });
    addEditButtonBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      addEditDraftButton();
      addEditButtonModal.classList.add("hidden");
    }, { passive: false });

    // Open add edit button sub-modal
    openAddEditButtonModalBtn.addEventListener("click", () => {
      editButtonNameInput.value = "";
      editButtonTypeInput.value = "label";
      editButtonValueInput.value = "";
      editButtonImageData = "";
      editButtonImageInput.value = "";
      editButtonImagePreview.innerHTML = "";
      editButtonLinkGroup.style.display = "block";
      editButtonImageGroup.style.display = "none";
      addEditButtonModal.classList.remove("hidden");
    });
    openAddEditButtonModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      editButtonNameInput.value = "";
      editButtonTypeInput.value = "label";
      editButtonValueInput.value = "";
      editButtonImageData = "";
      editButtonImageInput.value = "";
      editButtonImagePreview.innerHTML = "";
      editButtonLinkGroup.style.display = "block";
      editButtonImageGroup.style.display = "none";
      addEditButtonModal.classList.remove("hidden");
    }, { passive: false });

    // Close add edit button sub-modal
    addEditButtonModal.addEventListener("click", (e) => {
      if (e.target === addEditButtonModal) addEditButtonModal.classList.add("hidden");
    });

    // Edit button type change handler - show/hide file input for image
    editButtonTypeInput.addEventListener("change", () => {
      if (editButtonTypeInput.value === "image") {
        editButtonLinkGroup.style.display = "none";
        editButtonImageGroup.style.display = "block";
      } else if (editButtonTypeInput.value === "link") {
        editButtonLinkGroup.style.display = "block";
        editButtonImageGroup.style.display = "none";
      } else {
        editButtonLinkGroup.style.display = "none";
        editButtonImageGroup.style.display = "none";
      }
    });

    // Edit button image file upload
    editButtonImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        editButtonImageData = ev.target.result;
        editButtonImagePreview.innerHTML = `<img src="${editButtonImageData}" style="width:100%; height:100%; object-fit:cover;">`;
      };
      reader.readAsDataURL(file);
    });
    
    closeEditCardModalBtn.addEventListener("click", closeEditCardModal);
    closeEditCardModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeEditCardModal();
    }, { passive: false });
    
    saveEditCardBtn.addEventListener("click", saveEditedCard);
    saveEditCardBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      saveEditedCard();
    }, { passive: false });
    editCardModal.addEventListener("click", (e) => {
      if (e.target === editCardModal) closeEditCardModal();
    });

    // Entry modal
    closeEntryModalBtn.addEventListener("click", closeEntryModal);
    closeEntryModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeEntryModal();
    }, { passive: false });
    
    copyAllEntriesBtn.addEventListener("click", copyAllEntries);
    copyAllEntriesBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      copyAllEntries();
    }, { passive: false });
    entryNewLabelInput.addEventListener("blur", autoSaveEntryOnBlur);
    entrySearchInput.addEventListener("input", renderEntryList);
    entryModal.addEventListener("click", (e) => {
      if (e.target === entryModal) closeEntryModal();
    });

    // Description modal
    closeDescriptionModalBtn.addEventListener("click", () => descriptionModal.classList.add("hidden"));
    closeDescriptionModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      descriptionModal.classList.add("hidden");
    }, { passive: false });
    
    saveEntryDescriptionBtn.addEventListener("click", saveEntryDescription);
    saveEntryDescriptionBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      saveEntryDescription();
    }, { passive: false });
    descriptionModal.addEventListener("click", (e) => {
      if (e.target === descriptionModal) descriptionModal.classList.add("hidden");
    });

    // Image modal
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) imageModal.classList.add("hidden");
    });

    // Card context menu
    document.getElementById("context-edit-card").addEventListener("click", () => {
      if (activeCardIdForContext) {
        openEditCardModal(activeCardIdForContext);
        cardContextMenu.classList.add("hidden");
      }
    });
    document.getElementById("context-delete-card").addEventListener("click", () => {
      if (activeCardIdForContext) {
        deleteCard(activeCardIdForContext);
        cardContextMenu.classList.add("hidden");
      }
    });
    cardContextMenu.addEventListener("click", (e) => {
      if (e.target === cardContextMenu) cardContextMenu.classList.add("hidden");
    });

    // Search functionality
    searchInput.addEventListener("input", (e) => performSearch(e.target.value));
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      performSearch("");
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

  function groupCardCount() {
    return state.cards.filter((c) => c.groupId === groupId).length;
  }

  function groupTotalEntries() {
    return state.cards
      .filter((c) => c.groupId === groupId && c.cardType === "database")
      .reduce((sum, card) => sum + (card.entries || []).length, 0);
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
      copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return copy;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function performSearch(query) {
    currentSearchQuery = query.toLowerCase().trim();
    if (currentSearchQuery) {
      renderGroupPage();
    } else {
      renderGroupPage();
    }
  }

  function cardMatchesSearch(card, query) {
    if (!query) return true;
    const searchTerms = query.toLowerCase().split(/\s+/);
    const cardName = (card.title || "").toLowerCase();
    const cardClicks = String(card.clicks || 0);
    const entryCount = String((card.entries || []).length);
    const buttonNames = (card.buttons || []).map(b => (b.name || "").toLowerCase()).join(" ");
    const buttonClicks = (card.buttons || []).map(b => String(b.clickCount || 0)).join(" ");
    return searchTerms.every(term =>
      cardName.includes(term) ||
      cardClicks === term ||
      entryCount === term ||
      buttonNames.includes(term) ||
      buttonClicks === term
    );
  }

  function renderGroupPage() {
    const group = getGroup();
    if (!group) return;

    document.title = `${group.title} — Group`;
    groupTitleEl.textContent = group.title;
    groupDescriptionEl.textContent = group.description || "";
    
    // Update Group Info section
    if (groupCreatedEl && group.createdAt) {
      groupCreatedEl.textContent = new Date(group.createdAt).toLocaleString();
    }
    if (statCards) statCards.textContent = groupCardCount();
    if (statEntries) statEntries.textContent = groupTotalEntries();
    if (statTotal) statTotal.textContent = groupTotalClicks();
    if (statWeek) statWeek.textContent = groupClicksSince(7);
    if (statMonth) statMonth.textContent = groupClicksSince(30);
    
    // Update cover photo
    if (groupCoverPhoto) {
      if (group.coverUrl) {
        groupCoverPhoto.style.backgroundImage = `url('${escapeAttribute(group.coverUrl)}')`;
        groupCoverPhoto.classList.remove("hidden");
      } else {
        groupCoverPhoto.style.backgroundImage = '';
        groupCoverPhoto.classList.add("hidden");
      }
    }
    
    groupLayoutSelect.value = group.layout || "3";
    groupSortSelect.value = group.sort || "newest";

    const groupCards = sortCards(
      state.cards.filter((c) => c.groupId === groupId && cardMatchesSearch(c, currentSearchQuery)),
      group.sort
    );
    cardsContainer.className = `cards-grid layout-${group.layout || "3"}`;
    cardsContainer.innerHTML = "";
    if (groupCards.length === 0) {
      if (currentSearchQuery) {
        cardsContainer.innerHTML = `<p class="muted">No cards found matching "${escapeHtml(currentSearchQuery)}".</p>`;
      } else {
        cardsContainer.innerHTML = `<p class="muted">No cards in this group yet. <a href="./index.html">← Go back</a> to add cards.</p>`;
      }
    } else {
      groupCards.forEach((card) => cardsContainer.appendChild(renderCard(card)));
    }
  }

  function renderCard(card) {
    const el = document.createElement("article");
    const cardType = card.cardType || "standard";
    const isDatabaseCard = cardType === "database";
    const entryCount = (card.entries || []).length;
    const isAtLimit = isDatabaseCard
      ? card.clickLimit && entryCount >= card.clickLimit
      : card.clickLimit && card.clicks >= card.clickLimit;
    const isAtGroupLimit = isGroupAtLimit();
    const isUnclickable = isAtLimit || isAtGroupLimit;

    el.className = "card" + (isUnclickable ? " card-limit-reached" : "");
    el.setAttribute("data-card-id", card.id);
    const imageContent = card.imageUrl
      ? `<div class="card-image" style="background-image:url('${escapeAttribute(card.imageUrl)}')"></div>`
      : `<div class="card-image">${escapeHtml(card.title.charAt(0).toUpperCase())}</div>`;
    const buttonChips = card.buttons.map((b) => `<span class="chip">${escapeHtml(b.name)} ${b.clickCount}</span>`).join("");
    
    const mainCount = isDatabaseCard ? `Entries ${entryCount}` : `Card ${card.clicks}`;
    const limitIndicator = card.clickLimit
      ? `<span class="chip ${isAtLimit ? 'limit-reached' : ''}">${isDatabaseCard ? entryCount : card.clicks}/${card.clickLimit}</span>`
      : '';
    const allClicksRow = `<span class="chip">${mainCount}</span>${limitIndicator}${buttonChips}`;
    el.innerHTML = `
      ${imageContent}
      <div class="card-content">
        <div class="card-top">
          <div>
            <strong>${escapeHtml(card.title)}</strong>
            <p class="muted">Type: ${isDatabaseCard ? "Database" : "Standard"}${isUnclickable ? ' <span style="color:#dc2626;font-weight:bold;">(LIMIT REACHED)</span>' : ''}</p>
            <p class="muted">${escapeHtml(card.description || "No description")}</p>
          </div>
        </div>
        <div class="button-summary-row">${allClicksRow || '<span class="muted">No clicks</span>'}</div>
        <div class="card-action-row">
          ${isDatabaseCard ? `<button data-open-entries="${card.id}" class="inline-btn" type="button">View Entries</button>` : ""}
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

    // Press and hold for context menu
    const startLongPress = (e) => {
      if (e.target.closest("button, select, input, textarea, a")) return;
      longPressTimer = setTimeout(() => {
        activeCardIdForContext = card.id;
        cardContextMenu.classList.remove("hidden");
      }, 500);
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

    // Click for labeled entries (database cards only)
    el.addEventListener("click", (event) => {
      if (event.target.closest("button, select, input, textarea, a")) return;
      if (isAtLimit) {
        if (isDatabaseCard) {
            alert("This card has reached its entry limit and can no longer create new entries.");
        } else {
            alert("This card has reached its click limit and is unclickable.");
        }
        return;
      }
      registerClick(card.id, "card", "Card");
      if (isDatabaseCard) {
        openEntryModal(card.id);
      }
    });

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
    card.updatedAt = nowIso();
    // Only track button click, don't increment card.clicks
    saveStateToFirestore();
    renderGroupPage();
    if (button.type === "link" && button.value) window.open(button.value, "_blank", "noopener,noreferrer");
    if (button.type === "image" && button.value) {
      fullscreenImage.src = button.value;
      imageModal.classList.remove("hidden");
    }
  }

  async function deleteCard(cardId) {
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
    editGroupClickLimitInput.value = group.clickLimit || "";
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
    editG 