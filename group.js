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
  const createCardBtn = document.getElementById("open-create-card-modal-btn");

  // Create card modal
  const createCardModal = document.getElementById("create-card-modal");
  const closeCreateCardModalBtn = document.getElementById("close-create-card-modal-btn");
  const cardTitleInput = document.getElementById("card-title-input");
  const cardTypeInput = document.getElementById("card-type-input");
  const cardDescriptionInput = document.getElementById("card-description-input");
  const cardImageInput = document.getElementById("card-image-input");
  const cardImagePreview = document.getElementById("card-image-preview");
  let cardImageData = "";
  const cardClickLimitInput = document.getElementById("card-click-limit-input");
  const cardGroupSelect = document.getElementById("card-group-select");
  const addButtonModal = document.getElementById("add-button-modal");
  const openAddButtonModalBtn = document.getElementById("open-add-button-modal-btn");
  const buttonLinkGroup = document.getElementById("button-link-group");
  const buttonImageGroup = document.getElementById("button-image-group");
  const addButtonBtn = document.getElementById("add-button-btn");
  const buttonNameInput = document.getElementById("button-name-input");
  const buttonTypeInput = document.getElementById("button-type-input");
  const buttonValueInput = document.getElementById("button-value-input");
  const buttonImageInput = document.getElementById("button-image-input");
  const buttonImagePreview = document.getElementById("button-image-preview");
  let buttonImageData = "";
  const buttonDraftList = document.getElementById("button-draft-list");
  const saveCardBtn = document.getElementById("create-card-btn");
  let draftButtons = [];

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

  // Helper function for mobile-compatible event handling
  function addMobileEventListener(element, handler) {
    if (!element) return;
    // Use pointer events for better mobile compatibility
    element.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      handler(e);
    });
    // Fallback to click for older browsers
    element.addEventListener("click", handler);
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

    // Create card modal - mobile compatible
    createCardBtn.addEventListener("click", openCreateCardModal);
    createCardBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      openCreateCardModal();
    }, { passive: false });
    
    closeCreateCardModalBtn.addEventListener("click", closeCreateCardModal);
    closeCreateCardModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeCreateCardModal();
    }, { passive: false });
    
    addButtonBtn.addEventListener("click", () => {
      addDraftButton();
      addButtonModal.classList.add("hidden");
    });
    addButtonBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      addDraftButton();
      addButtonModal.classList.add("hidden");
    }, { passive: false });

    // Open add button sub-modal
    openAddButtonModalBtn.addEventListener("click", () => {
      buttonNameInput.value = "";
      buttonTypeInput.value = "label";
      buttonValueInput.value = "";
      buttonImageData = "";
      buttonImageInput.value = "";
      buttonImagePreview.innerHTML = "";
      buttonLinkGroup.style.display = "block";
      buttonImageGroup.style.display = "none";
      addButtonModal.classList.remove("hidden");
    });
    openAddButtonModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      buttonNameInput.value = "";
      buttonTypeInput.value = "label";
      buttonValueInput.value = "";
      buttonImageData = "";
      buttonImageInput.value = "";
      buttonImagePreview.innerHTML = "";
      buttonLinkGroup.style.display = "block";
      buttonImageGroup.style.display = "none";
      addButtonModal.classList.remove("hidden");
    }, { passive: false });

    // Close add button sub-modal
    addButtonModal.addEventListener("click", (e) => {
      if (e.target === addButtonModal) addButtonModal.classList.add("hidden");
    });

    // Button type change handler - show/hide file input for image
    buttonTypeInput.addEventListener("change", () => {
      if (buttonTypeInput.value === "image") {
        buttonLinkGroup.style.display = "none";
        buttonImageGroup.style.display = "block";
      } else if (buttonTypeInput.value === "link") {
        buttonLinkGroup.style.display = "block";
        buttonImageGroup.style.display = "none";
      } else {
        buttonLinkGroup.style.display = "none";
        buttonImageGroup.style.display = "none";
      }
    });

    // Button image file upload
    buttonImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        buttonImageData = ev.target.result;
        buttonImagePreview.innerHTML = `<img src="${buttonImageData}" style="width:100%; height:100%; object-fit:cover;">`;
      };
      reader.readAsDataURL(file);
    });
    
    saveCardBtn.addEventListener("click", createCard);
    saveCardBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      createCard();
    }, { passive: false });
    createCardModal.addEventListener("click", (e) => {
      if (e.target === createCardModal) closeCreateCardModal();
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
    const isAtCardLimit = card.clickLimit && card.clicks >= card.clickLimit;
    const isAtGroupLimit = isGroupAtLimit();
    const isUnclickable = isAtCardLimit || isAtGroupLimit;
    el.className = "card" + (isUnclickable ? " card-limit-reached" : "");
    el.setAttribute("data-card-id", card.id);
    const imageContent = card.imageUrl
      ? `<div class="card-image" style="background-image:url('${escapeAttribute(card.imageUrl)}')"></div>`
      : `<div class="card-image">${escapeHtml(card.title.charAt(0).toUpperCase())}</div>`;
    const buttonChips = card.buttons.map((b) => `<span class="chip">${escapeHtml(b.name)} ${b.clickCount}</span>`).join("");
    const entryCount = (card.entries || []).length;
    const mainCount = isDatabaseCard ? `Entries ${entryCount}` : `Card ${card.clicks}`;
    const limitIndicator = card.clickLimit
      ? `<span class="chip ${isAtCardLimit ? 'limit-reached' : ''}">${card.clicks}/${card.clickLimit}</span>`
      : '';
    const allClicksRow = `<span class="chip">${mainCount}</span>${limitIndicator}${buttonChips}`;
    el.innerHTML = `
      ${imageContent}
      <div class="card-content">
        <div class="card-top">
          <div>
            <strong>${escapeHtml(card.title)}</strong>
            <p class="muted">Type: ${isDatabaseCard ? "Labeled Clicks" : "Standard"}${isUnclickable ? ' <span style="color:#dc2626;font-weight:bold;">(LIMIT REACHED)</span>' : ''}</p>
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
      if (card.clickLimit && card.clicks >= card.clickLimit) {
        alert("This card has reached its click limit and is unclickable.");
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

  // ── Create card modal functions ─────────────────────────────────────────────

  function openCreateCardModal() {
    draftButtons = [];
    cardTitleInput.value = "";
    cardTypeInput.value = "standard";
    cardDescriptionInput.value = "";
    cardImageInput.value = "";
    cardImageData = "";
    if (cardImagePreview) cardImagePreview.innerHTML = "";
    cardClickLimitInput.value = "";
    // Populate Group dropdown
    cardGroupSelect.innerHTML = "";
    const noneOption = document.createElement("option");
    noneOption.textContent = "Current group";
    noneOption.value = "";
    cardGroupSelect.appendChild(noneOption);
    state.groups.forEach((g) => {
      const option = document.createElement("option");
      option.value = g.id;
      option.textContent = g.title;
      if (g.id === groupId) option.selected = true;
      cardGroupSelect.appendChild(option);
    });
    buttonNameInput.value = "";
    buttonTypeInput.value = "label";
    buttonValueInput.value = "";
    buttonImageData = "";
    buttonImageInput.value = "";
    buttonImagePreview.innerHTML = "";
    buttonLinkGroup.style.display = "block";
    buttonImageGroup.style.display = "none";
    renderDraftButtons();
    createCardModal.classList.remove("hidden");
  }

  function closeCreateCardModal() {
    createCardModal.classList.add("hidden");
    draftButtons = [];
    cardImageData = "";
    if (cardImagePreview) cardImagePreview.innerHTML = "";
    buttonImageData = "";
    buttonImageInput.value = "";
    buttonImagePreview.innerHTML = "";
  }

  function addDraftButton() {
    const name = buttonNameInput.value.trim();
    const type = buttonTypeInput.value;
    const value = buttonValueInput.value.trim();
    if (!name) { alert("Button name is required."); return; }
    if (draftButtons.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      alert("A button with this name already exists on this card.");
      return;
    }
    if (type === "link" && !value) {
      alert("Please add a URL value for link button.");
      return;
    }
    if (type === "image" && !buttonImageData) {
      alert("Please upload an image for the image button.");
      return;
    }
    // For image, use the uploaded image data as the value
    const buttonValue = type === "image" ? buttonImageData : value;
    draftButtons.push({ id: uid("btn"), name, type, value: buttonValue, clickCount: 0 });
    // Reset to default type
    buttonTypeInput.value = "label";
    buttonValueInput.style.display = "block";
    buttonImageInput.style.display = "none";
    buttonImagePreview.style.display = "none";
    buttonImageData = "";
    buttonImageInput.value = "";
    buttonImagePreview.innerHTML = "";
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
        <span class="chip">${escapeHtml(btn.name)} (${escapeHtml(btn.type)})</span>
        <button class="inline-btn danger-btn" data-remove-draft-id="${btn.id}" type="button">Remove</button>
      `;
      buttonDraftList.appendChild(li);
    });
    buttonDraftList.querySelectorAll("[data-remove-draft-id]").forEach((el) => {
      el.addEventListener("click", () => removeDraftButton(el.getAttribute("data-remove-draft-id")));
    });
  }

  async function createCard() {
    const title = cardTitleInput.value.trim();
    if (!title) { alert("Card title is required."); return; }
    const selectedGroupId = cardGroupSelect.value || groupId;
    // Check for duplicate card title in the selected group
    const existingCard = state.cards.find((c) => c.groupId === selectedGroupId && c.title.toLowerCase() === title.toLowerCase());
    if (existingCard) {
      alert("A card with this name already exists in the selected group.");
      return;
    }
    const clickLimitValue = cardClickLimitInput.value.trim();
    const clickLimit = clickLimitValue ? parseInt(clickLimitValue, 10) : null;
    state.cards.unshift({
      id: uid("card"),
      groupId: selectedGroupId,
      title,
      cardType: cardTypeInput.value,
      description: cardDescriptionInput.value.trim(),
      imageUrl: cardImageData,
      clickLimit,
      clicks: 0,
      clickHistory: [],
      buttons: draftButtons.map((button) => ({ ...button })),
      entries: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await saveStateToFirestore();
    renderGroupPage();
    closeCreateCardModal();
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
    editGroupCoverInput.value = "";
    editGroupClickLimitInput.value = "";
    if (editGroupCoverPreview) editGroupCoverPreview.innerHTML = "";
    editGroupModal.classList.add("hidden");
  }

  async function saveEditedGroup() {
    const group = getGroup();
    if (!group) return;
    const title = editGroupTitleInput.value.trim();
    if (!title) { alert("Group title is required."); return; }
    const clickLimitValue = editGroupClickLimitInput.value.trim();
    group.title = title;
    group.description = editGroupDescriptionInput.value.trim();
    group.coverUrl = editGroupCoverData || group.coverUrl;
    group.clickLimit = clickLimitValue ? parseInt(clickLimitValue, 10) : null;
    group.updatedAt = nowIso();
    await saveStateToFirestore();
    renderGroupPage();
    closeEditGroupModal();
  }

  function isGroupAtLimit() {
    const group = getGroup();
    if (!group || !group.clickLimit) return false;
    return groupTotalClicks() >= group.clickLimit;
  }

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
    if (editDraftButtons.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      alert("A button with this name already exists on this card.");
      return;
    }
    if (type === "link" && !value) {
      alert("Please add a URL value for link button.");
      return;
    }
    if (type === "image" && !editButtonImageData) {
      alert("Please upload an image for the image button.");
      return;
    }
    // For image, use the uploaded image data as the value
    const buttonValue = type === "image" ? editButtonImageData : value;
    editDraftButtons.push({ id: uid("btn"), name, type, value: buttonValue, clickCount: 0 });
    // Reset to default type
    editButtonTypeInput.value = "label";
    editButtonValueInput.style.display = "block";
    editButtonImageInput.style.display = "none";
    editButtonImagePreview.style.display = "none";
    editButtonImageData = "";
    editButtonImageInput.value = "";
    editButtonImagePreview.innerHTML = "";
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
    editCardTypeInput.disabled = true;
    editCardDescriptionInput.value = card.description || "";
    editCardImageInput.value = "";
    editCardImageData = "";
    if (editCardImagePreview) {
      if (card.imageUrl) {
        editCardImagePreview.innerHTML = `<img src="${card.imageUrl}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        editCardImagePreview.innerHTML = "";
      }
    }
    editCardClickLimitInput.value = card.clickLimit || "";
    // Populate card info stats
    const totalClicks = (card.clicks || 0) + (card.buttons || []).reduce((sum, b) => sum + (b.clickCount || 0), 0);
    const isDatabaseCard = card.cardType === "database";
    const entryCount = (card.entries || []).length;
    
    // Show/hide stats based on card type
    if (editCardClicksRow) editCardClicksRow.style.display = isDatabaseCard ? "none" : "inline";
    if (editCardWeekRow) editCardWeekRow.style.display = isDatabaseCard ? "none" : "inline";
    if (editCardMonthRow) editCardMonthRow.style.display = isDatabaseCard ? "none" : "inline";
    if (editCardEntriesRow) editCardEntriesRow.style.display = isDatabaseCard ? "inline" : "none";
    
    // Populate stats
    if (editCardTotalClicks) editCardTotalClicks.textContent = totalClicks.toString();
    if (editCardWeekClicks) editCardWeekClicks.textContent = clicksSince(card, 7).toString();
    if (editCardMonthClicks) editCardMonthClicks.textContent = clicksSince(card, 30).toString();
    if (editCardEntriesCount) editCardEntriesCount.textContent = entryCount.toString();
    if (editCardCreated && card.createdAt) editCardCreated.textContent = new Date(card.createdAt).toLocaleString();
    
    // For database cards, show entry count in total row
    if (isDatabaseCard && editCardTotalClicks) {
      editCardTotalClicks.textContent = entryCount.toString() + " entries";
    }
    // Populate button click stats
    if (editCardButtonStats) {
      const buttonStatsHtml = (card.buttons || []).map((b) => 
        `<span class="chip" style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:4px; font-size:0.8rem;">${escapeHtml(b.name)}: ${b.clickCount || 0}</span>`
      ).join("");
      editCardButtonStats.innerHTML = buttonStatsHtml || '<span class="muted" style="font-size:0.8rem;">No labeled buttons</span>';
    }
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
    editButtonImageData = "";
    editButtonImageInput.value = "";
    editButtonImagePreview.innerHTML = "";
    editButtonLinkGroup.style.display = "block";
    editButtonImageGroup.style.display = "none";
    renderEditDraftButtons();
    editCardModal.classList.remove("hidden");
  }

  function closeEditCardModal() {
    activeCardIdForEdit = null;
    editDraftButtons = [];
    editCardImageData = "";
    if (editCardImagePreview) editCardImagePreview.innerHTML = "";
    editButtonNameInput.value = "";
    editButtonTypeInput.value = "label";
    editButtonValueInput.value = "";
    editButtonImageData = "";
    editButtonImageInput.value = "";
    editButtonImagePreview.innerHTML = "";
    editCardModal.classList.add("hidden");
  }

  async function saveEditedCard() {
    const card = state.cards.find((c) => c.id === activeCardIdForEdit);
    if (!card) return;
    const newGroupId = editCardGroupSelect.value;
    const title = editCardTitleInput.value.trim();
    if (!title) { alert("Card title is required."); return; }
    // Check for duplicate card title in the target group (excluding current card)
    const existingCard = state.cards.find((c) => c.id !== activeCardIdForEdit && c.groupId === (newGroupId || null) && c.title.toLowerCase() === title.toLowerCase());
    if (existingCard) {
      alert("A card with this name already exists in the target group.");
      return;
    }
    const clickLimitValue = editCardClickLimitInput.value.trim();
    card.groupId = newGroupId || null;
    card.title = title;
    card.cardType = editCardTypeInput.value;
    card.description = editCardDescriptionInput.value.trim();
    card.imageUrl = editCardImageData || card.imageUrl;
    card.clickLimit = clickLimitValue ? parseInt(clickLimitValue, 10) : null;
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
    signOutBtn.addEventListener("click", async () => {
      authHint.textContent = "";
      setLoadingUI(); // Show loading immediately when signing out
      try {
        await signOut(auth);
      } catch (err) {
        authHint.textContent = err?.message || "Sign-out failed.";
        authHint.style.color = "#b91c1c";
        setSignedOutUI(); // Only show welcome if sign-out fails
      }
    });
    signInBtn.addEventListener("click", async () => {
      authHint.textContent = "";
      setLoadingUI(); // Show loading immediately when signing in
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        authHint.textContent = err?.message || "Sign-in failed. Please try again.";
        authHint.style.color = "#b91c1c";
        setSignedOutUI(); // Show welcome only if sign-in fails
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

  // Handle page visibility changes (back button navigation)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentUserId) {
      // Re-render when user comes back to ensure UI is up to date
      const group = getGroup();
      if (group) {
        renderGroupPage();
      }
    }
  });

  // Show loading state initially while auth is being determined
  setLoadingUI();
});
