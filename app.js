import { firebaseConfig } from "./firebase-config.js";

// Unregister any existing service workers and reload once if the page is still controlled by an old SW.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      const hadController = !!navigator.serviceWorker.controller;
      return Promise.all(registrations.map((registration) => registration.unregister()))
        .then(() => {
          if (hadController && !sessionStorage.getItem('swReloaded')) {
            sessionStorage.setItem('swReloaded', '1');
            window.location.reload();
          }
        });
    })
    .catch((err) => console.warn('Service worker unregister failed:', err));
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
  const loadingScreen = document.getElementById("loading-screen");

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
  const cardClickLimitInput = document.getElementById("card-click-limit-input");
  const createCardBtn = document.getElementById("create-card-btn");
  const openCreateCardModalBtn = document.getElementById("open-create-card-modal-btn");
  const closeCreateCardModalBtn = document.getElementById("close-create-card-modal-btn");
  const createCardModal = document.getElementById("create-card-modal");
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
  const cardContextMenu = document.getElementById("card-context-menu");
  const contextEditCardBtn = document.getElementById("context-edit-card");
  const contextDeleteCardBtn = document.getElementById("context-delete-card");

  // Group context menu
  const groupContextMenu = document.getElementById("group-context-menu");
  const contextEditGroupBtn = document.getElementById("context-edit-group");
  const contextDeleteGroupBtn = document.getElementById("context-delete-group");

  // Edit group modal
  const editGroupModal = document.getElementById("edit-group-modal");
  const closeEditGroupModalBtn = document.getElementById("close-edit-group-modal-btn");
  const editGroupTitleInput = document.getElementById("edit-group-title-input");
  const editGroupDescriptionInput = document.getElementById("edit-group-description-input");
  const editGroupCoverInput = document.getElementById("edit-group-cover-input");
  const editGroupCoverPreview = document.getElementById("edit-group-cover-preview");
  const editGroupClickLimitInput = document.getElementById("edit-group-click-limit-input");
  const saveEditGroupBtn = document.getElementById("save-edit-group-btn");
  let editGroupCoverData = "";
  const closeEditCardModalBtn = document.getElementById("close-edit-card-modal-btn");
  const editCardModal = document.getElementById("edit-card-modal");
  const addEditButtonModal = document.getElementById("add-edit-button-modal");
  const openAddEditButtonModalBtn = document.getElementById("open-add-edit-button-modal-btn");
  const editButtonLinkGroup = document.getElementById("edit-button-link-group");
  const editButtonImageGroup = document.getElementById("edit-button-image-group");
  const editCardGroupSelect = document.getElementById("edit-card-group-select");
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
  const editCardTitleInput = document.getElementById("edit-card-title-input");
  const editCardTypeInput = document.getElementById("edit-card-type-input");
  const editCardDescriptionInput = document.getElementById("edit-card-description-input");
  const editCardImageInput = document.getElementById("edit-card-image-input");
  const editCardImagePreview = document.getElementById("edit-card-image-preview");
  let editCardImageData = "";
  const editCardClickLimitInput = document.getElementById("edit-card-click-limit-input");
  const addEditButtonBtn = document.getElementById("add-edit-button-btn");
  const editButtonNameInput = document.getElementById("edit-button-name-input");
  const editButtonTypeInput = document.getElementById("edit-button-type-input");
  const editButtonValueInput = document.getElementById("edit-button-value-input");
  const editButtonImageInput = document.getElementById("edit-button-image-input");
  const editButtonImagePreview = document.getElementById("edit-button-image-preview");
  let editButtonImageData = "";
  const editButtonDraftList = document.getElementById("edit-button-draft-list");
  const saveEditCardBtn = document.getElementById("save-edit-card-btn");
  const groupsContainer = document.getElementById("groups-container");
  const entryModal = document.getElementById("entry-modal");
  const entryModalTitle = document.getElementById("entry-modal-title");
  const closeEntryModalBtn = document.getElementById("close-entry-modal-btn");
  const entrySearchInput = document.getElementById("entry-search-input");
  const entrySortSelect = document.getElementById("entry-sort-select");
  const copyAllEntriesBtn = document.getElementById("copy-all-entries-btn");
  const entryNewLabelInput = document.getElementById("entry-new-label-input");
  const entryList = document.getElementById("entry-list");

  const descriptionModal = document.getElementById("description-modal");
  const descriptionModalTitle = document.getElementById("description-modal-title");
  const closeDescriptionModalBtn = document.getElementById("close-description-modal-btn");
  const entryNameInput = document.getElementById("edit-entry-label-input");
  const entryNumberInput = document.getElementById("edit-entry-position-input");
  const entryDescriptionInput = document.getElementById("entry-description-input");
  const saveEntryDescriptionBtn = document.getElementById("save-entry-description-btn");
  const entryButtonStats = document.getElementById("entry-button-stats");
  const editEntryPositionInput = document.getElementById("edit-entry-position-input");

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
  let activeGroupIdForEdit = null;
  let activeGroupIdForContext = null;

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

  const searchBar = document.getElementById("search-bar");
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  let currentSearchQuery = "";

  function performSearch(query) {
    currentSearchQuery = query.toLowerCase().trim();
    if (currentSearchQuery) {
      renderSearchResults();
    } else {
      renderAll();
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
    
    // Check if card properties match
    const cardMatches = searchTerms.every(term =>
      cardName.includes(term) ||
      cardClicks === term ||
      entryCount === term ||
      buttonNames.includes(term) ||
      buttonClicks === term
    );
    
    if (cardMatches) return true;
    
    // Check if any entries match the search
    if (card.entries && card.entries.length > 0) {
      const hasMatchingEntry = card.entries.some(entry => {
        const entryLabel = (entry.label || "").toLowerCase();
        const entryDesc = (entry.description || "").toLowerCase();
        return searchTerms.some(term => 
          entryLabel.includes(term) || 
          entryDesc.includes(term)
        );
      });
      if (hasMatchingEntry) return true;
    }
    
    return false;
  }

  function renderSearchResults() {
    groupsContainer.innerHTML = "";
    const matchingCards = state.cards.filter(card => cardMatchesSearch(card, currentSearchQuery));
    if (matchingCards.length === 0) {
      groupsContainer.innerHTML = `<p class="muted">No cards found matching "${escapeHtml(currentSearchQuery)}".</p>`;
      return;
    }
    const cardsGrid = document.createElement("div");
    cardsGrid.className = "cards-grid layout-3";
    matchingCards.forEach((card) => cardsGrid.appendChild(renderCard(card)));
    groupsContainer.appendChild(cardsGrid);
  }
  
  function updateCreateCardLimitLabel() {
    const createCardLimitLabel = document.getElementById("create-card-limit-label");
    const isDatabase = cardTypeInput.value === "database";
    if (createCardLimitLabel) {
        createCardLimitLabel.textContent = isDatabase ? "Entry Limit (optional)" : "Click Limit (optional)";
    }
    if (cardClickLimitInput) {
        cardClickLimitInput.placeholder = isDatabase ? "e.g., 100 - card stops creating entries at limit" : "e.g., 100 - card becomes unclickable at limit";
    }
  }

  function initAppOnce() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    createGroupBtn.addEventListener("click", createGroup);
    createGroupBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      createGroup();
    }, { passive: false });
    
    openCreateGroupModalBtn.addEventListener("click", () => createGroupModal.classList.remove("hidden"));
    openCreateGroupModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      createGroupModal.classList.remove("hidden");
    }, { passive: false });
    
    closeCreateGroupModalBtn.addEventListener("click", () => createGroupModal.classList.add("hidden"));
    closeCreateGroupModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      createGroupModal.classList.add("hidden");
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
    
    createCardBtn.addEventListener("click", createCard);
    createCardBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      createCard();
    }, { passive: false });
    
    cardTypeInput.addEventListener("change", updateCreateCardLimitLabel);

    openCreateCardModalBtn.addEventListener("click", () => {
        updateCreateCardLimitLabel();
        createCardModal.classList.remove("hidden");
    });
    openCreateCardModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      updateCreateCardLimitLabel();
      createCardModal.classList.remove("hidden");
    }, { passive: false });
    
    closeCreateCardModalBtn.addEventListener("click", () => createCardModal.classList.add("hidden"));
    closeCreateCardModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      createCardModal.classList.add("hidden");
    }, { passive: false });

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
    closeEditCardModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeEditCardModal();
    }, { passive: false });
    
    saveEditCardBtn.addEventListener("click", saveEditedCard);
    saveEditCardBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      saveEditedCard();
    }, { passive: false });

    // Edit group modal listeners
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

    // Group cover image upload
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
    
    closeEntryModalBtn.addEventListener("click", closeEntryModal);
    closeEntryModalBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      closeEntryModal();
    }, { passive: false });
    
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
    
    copyAllEntriesBtn.addEventListener("click", copyAllEntries);
    copyAllEntriesBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      copyAllEntries();
    }, { passive: false });
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

    // Group context menu listeners
    contextEditGroupBtn.addEventListener("click", () => {
      if (activeGroupIdForContext) {
        groupContextMenu.classList.add("hidden");
        openEditGroupModal(activeGroupIdForContext);
        activeGroupIdForContext = null;
      }
    });
    contextDeleteGroupBtn.addEventListener("click", () => {
      if (activeGroupIdForContext) {
        groupContextMenu.classList.add("hidden");
        deleteGroup(activeGroupIdForContext);
        activeGroupIdForContext = null;
      }
    });
    groupContextMenu.addEventListener("click", (e) => {
      if (e.target === groupContextMenu) {
        groupContextMenu.classList.add("hidden");
        activeGroupIdForContext = null;
      }
    });

    entryNewLabelInput.addEventListener("blur", autoSaveEntryOnBlur);
    entrySearchInput.addEventListener("input", renderEntryList);
    entrySortSelect.addEventListener("change", renderEntryList);

    // Search functionality
    searchInput.addEventListener("input", (e) => performSearch(e.target.value));
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      performSearch("");
    });

    renderAll();
  }

  function setLoadingUI() {
    welcomeScreen.classList.add("hidden");
    appEl.classList.add("hidden");
    authBar.classList.add("hidden");
    signInBtn.classList.add("hidden");
    openCreateGroupModalBtn.classList.add("hidden");
    openCreateCardModalBtn.classList.add("hidden");
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
    openCreateGroupModalBtn.classList.add("hidden");
    openCreateCardModalBtn.classList.add("hidden");
  }

  function setSignedInUI(user) {
    if (loadingScreen) loadingScreen.classList.add("hidden");
    welcomeScreen.classList.add("hidden");
    appEl.classList.remove("hidden");
    authBar.classList.remove("hidden");
    signInBtn.classList.add("hidden");
    openCreateGroupModalBtn.classList.remove("hidden");
    openCreateCardModalBtn.classList.remove("hidden");
    searchBar.classList.remove("hidden");

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
    document.title = "Group";
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
    draftButtons.push({
      id: uid("btn"),
      name,
      type,
      value: buttonValue,
      clickCount: 0,
    });
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
    editDraftButtons.push({
      id: uid("btn"),
      name,
      type,
      value: buttonValue,
      clickCount: 0,
    });
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
    editCardImageData = "";
    renderEditGroupOptions(card.groupId);
    editCardTitleInput.value = card.title || "";
    editCardTypeInput.value = card.cardType || "standard";
    editCardTypeInput.disabled = true;
    editCardDescriptionInput.value = card.description || "";
    editCardClickLimitInput.value = card.clickLimit || "";
    
    const isDatabaseCard = card.cardType === "database";
    const editCardLimitLabel = document.getElementById("edit-card-limit-label");
    if (editCardLimitLabel) {
        editCardLimitLabel.textContent = isDatabaseCard ? "Entry Limit (optional)" : "Click Limit (optional)";
    }
    if (editCardClickLimitInput) {
        editCardClickLimitInput.placeholder = isDatabaseCard ? "e.g., 100 - card stops creating entries at limit" : "e.g., 100 - card becomes unclickable at limit";
    }

    if (editCardImagePreview) {
      if (card.imageUrl) {
        editCardImagePreview.innerHTML = `<img src="${card.imageUrl}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        editCardImagePreview.innerHTML = "";
      }
    }
    const totalClicks = (card.clicks || 0) + card.buttons.reduce((sum, b) => sum + (b.clickCount || 0), 0);
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
      const buttonStatsHtml = card.buttons.map((b) => 
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
    renderEditDraftButtons();
    editCardModal.classList.remove("hidden");
  }

  function closeEditCardModal() {
    activeCardIdForEdit = null;
    editDraftButtons = [];
    editButtonNameInput.value = "";
    editButtonTypeInput.value = "label";
    editButtonValueInput.value = "";
    editCardClickLimitInput.value = "";
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
    const clickLimitValue = editCardClickLimitInput.value.trim();
    card.clickLimit = clickLimitValue ? parseInt(clickLimitValue, 10) : null;
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
    const clickLimitValue = cardClickLimitInput.value.trim();
    state.cards.unshift({
      id: uid("card"),
      groupId: groupId || null,
      title,
      cardType,
      description: cardDescriptionInput.value.trim(),
      imageUrl: cardImageData,
      clickLimit: clickLimitValue ? parseInt(clickLimitValue, 10) : null,
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
    cardClickLimitInput.value = "";
    if (cardImagePreview) cardImagePreview.innerHTML = "";
    await saveStateToFirestore();
    renderAll();
    createCardModal.classList.add("hidden");
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
    listEl.className = "cards-grid layout-3";
    
    // Add heading outside the grid
    const headingEl = document.createElement("h3");
    headingEl.textContent = "Groups";
    groupsContainer.appendChild(headingEl);
    
    if (state.groups.length === 0) {
      const noGroupsMsg = document.createElement("p");
      noGroupsMsg.className = "muted";
      noGroupsMsg.textContent = "No groups yet. Create one to organize cards.";
      groupsContainer.appendChild(noGroupsMsg);
    } else {
      state.groups.forEach((group) => {
        const groupCards = state.cards.filter((c) => c.groupId === group.id);
        const cardCount = groupCards.length;
        const totalClicks = groupCards.reduce((sum, c) => sum + c.clicks, 0);
        const totalEntries = groupCards.reduce((sum, c) => sum + (c.entries?.length || 0), 0);
        const row = document.createElement("article");
        row.className = "card group-card";
        row.setAttribute("data-group-id", group.id);
        const imageContent = group.coverUrl
          ? `<div class="card-image" style="background-image:url('${escapeAttribute(group.coverUrl)}')"></div>`
          : `<div class="card-image">${escapeHtml(group.title.charAt(0).toUpperCase())}</div>`;
        row.innerHTML = `
          ${imageContent}
          <div class="card-content">
            <div>
              <strong>${escapeHtml(group.title)}</strong>
              <p class="muted">${escapeHtml(group.description || "No description")}</p>
            </div>
            <div class="button-summary-row" style="margin-top:auto;">
              <span class="chip">Cards: ${cardCount}</span>
              <span class="chip">Total: ${totalClicks}</span>
              <span class="chip">Entries: ${totalEntries}</span>
            </div>
          </div>
        `;

        // Press and hold for context menu
        const startLongPress = (e) => {
          if (e.target.closest("button, select, input, textarea, a")) return;
          longPressTimer = setTimeout(() => {
            activeGroupIdForContext = group.id;
            groupContextMenu.classList.remove("hidden");
          }, 500);
        };
        const cancelLongPress = () => {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
        };

        row.addEventListener("mousedown", startLongPress);
        row.addEventListener("touchstart", startLongPress, { passive: true });
        row.addEventListener("mouseup", cancelLongPress);
        row.addEventListener("mouseleave", cancelLongPress);
        row.addEventListener("touchend", cancelLongPress);
        row.addEventListener("touchcancel", cancelLongPress);

        // Click to open group
        row.addEventListener("click", (event) => {
          if (event.target.closest("button, select, input, textarea, a")) return;
          window.location.href = `./group.html?id=${group.id}`;
        });

        listEl.appendChild(row);
      });
    }
    groupsContainer.appendChild(listEl);
  }

  function groupClicksSince(groupId, days) {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return state.cards
      .filter((c) => c.groupId === groupId)
      .reduce((sum, card) => sum + card.clickHistory.filter((item) => new Date(item.at).getTime() >= threshold).length, 0);
  }

  let longPressTimer;
  let activeCardIdForContext = null;

  function openEditGroupModal(groupId) {
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return;
    activeGroupIdForEdit = group.id;
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
    activeGroupIdForEdit = null;
    editGroupTitleInput.value = "";
    editGroupDescriptionInput.value = "";
    editGroupCoverData = "";
    editGroupCoverInput.value = "";
    editGroupClickLimitInput.value = "";
    if (editGroupCoverPreview) editGroupCoverPreview.innerHTML = "";
    editGroupModal.classList.add("hidden");
  }

  async function saveEditedGroup() {
    const group = state.groups.find((g) => g.id === activeGroupIdForEdit);
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
    renderAll();
    closeEditGroupModal();
  }

  async function deleteGroup(groupId) {
    if (!confirm("Are you sure you want to delete this group?")) return;
    state.groups = state.groups.filter((g) => g.id !== groupId);
    state.cards = state.cards.filter((c) => c.groupId !== groupId);
    await saveStateToFirestore();
    renderAll();
  }

  function renderCard(card) {
    const el = document.createElement("article");
    const cardType = card.cardType || "standard";
    const isDatabaseCard = cardType === "database";
    const entryCount = (card.entries || []).length;
    const isAtLimit = isDatabaseCard
      ? card.clickLimit && entryCount >= card.clickLimit
      : card.clickLimit && card.clicks >= card.clickLimit;

    el.className = "card" + (isAtLimit ? " card-limit-reached" : "");
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
            <p class="muted">Type: ${isDatabaseCard ? "Database" : "Standard"}${isAtLimit ? ' <span style="color:#dc2626;font-weight:bold;">(LIMIT REACHED)</span>' : ''}</p>
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
    if (card.clickLimit && (card.entries || []).length >= card.clickLimit) {
      alert("This card has reached its entry limit. You cannot add more entries.");
      return;
    }
    const nextNumber = card.entries.length > 0 ? Math.max(...card.entries.map(e => e.number || 0)) + 1 : 1;
    card.entries.unshift({
      id: uid("entry"),
      number: nextNumber,
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

  function getSortedEntries(card) {
    const hasSortOrder = card.entries.some(e => e.sortOrder !== undefined);
    return hasSortOrder
      ? [...card.entries].sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity) || new Date(a.createdAt) - new Date(b.createdAt))
      : [...card.entries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function buildEntryNumberMap(card) {
    const sorted = getSortedEntries(card);
    const map = new Map();
    sorted.forEach((e, idx) => map.set(e.id, idx + 1));
    return map;
  }

  function renderEntryList() {
    if (!activeCardIdForEntries) return;
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const numberMap = buildEntryNumberMap(card);
    const q = entrySearchInput.value.trim().toLowerCase();
    const sortMode = entrySortSelect.value;
    let entries = card.entries.filter((e) => e.label.toLowerCase().includes(q));

    if (sortMode === "oldest") {
      entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortMode === "most-clicks") {
      entries.sort((a, b) => {
        const aClicks = (a.buttons || []).reduce((sum, btn) => sum + (btn.clickCount || 0), 0);
        const bClicks = (b.buttons || []).reduce((sum, btn) => sum + (btn.clickCount || 0), 0);
        return bClicks - aClicks;
      });
    } else if (sortMode === "number") {
      entries.sort((a, b) => {
        const numA = a.number ?? Infinity;
        const numB = b.number ?? Infinity;
        return numA - numB;
      });
      } else if (sortMode === "newest") {
        entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      row.innerHTML = `
        <div class="entry-row-header">
          <strong>${displayNum}. ${escapeHtml(entry.label)}</strong>
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

  async function deleteEntry(entryId) {
    if (!activeCardIdForEntries) return;
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    card.entries = card.entries.filter((e) => e.id !== entryId);
    await saveStateToFirestore();
    renderEntryList();
  }

  async function copySingleEntry(entryId) {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === entryId);
    if (!entry) return;
    const displayNum = buildEntryNumberMap(card).get(entry.id);
    const text = `${displayNum}. ${entry.label} - ${new Date(entry.createdAt).toLocaleString()}`;
    await navigator.clipboard.writeText(text);
  }

  async function copyAllEntries() {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const numberMap = buildEntryNumberMap(card);
    const sorted = [...card.entries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const text = sorted
      .map((e) => `${numberMap.get(e.id)}. ${e.label} - ${new Date(e.createdAt).toLocaleString()}`)
      .join("\n");
    await navigator.clipboard.writeText(text || "");
  }

  function openDescriptionModal(entryId) {
    const card = state.cards.find((c) => c.id === activeCardIdForEntries);
    if (!card) return;
    const entry = card.entries.find((e) => e.id === entryId);
    if (!entry) return;
  activeEntryIdForDescription = entry.id;
  const displayNum = buildEntryNumberMap(card).get(entry.id);
  descriptionModalTitle.textContent = `Edit Entry #${displayNum}`;
  entryNameInput.value = entry.label;
  entryNumberInput.value = displayNum;
  entryNumberInput.max = card.entries.length;
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
  const newLabel = entryNameInput.value.trim();
  if (newLabel) entry.label = newLabel;
  const newNumber = parseInt(entryNumberInput.value, 10);
  if (!isNaN(newNumber) && newNumber > 0) {
    reorderEntriesAfterNumberChange(card, entry.id, newNumber);
  }
  entry.description = entryDescriptionInput.value;
    const total = card.entries.length;
    const newPos = parseInt(editEntryPositionInput.value, 10);
    if (!isNaN(newPos) && newPos >= 1 && newPos <= total) {
      const sorted = getSortedEntries(card);
      const withoutThis = sorted.filter(e => e.id !== entry.id);
      withoutThis.splice(newPos - 1, 0, entry);
      withoutThis.forEach((e, idx) => { e.sortOrder = idx + 1; });
    }
    await saveStateToFirestore();
    descriptionModal.classList.add("hidden");
    renderEntryList();
    renderGroups();
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
    let authStateResolved = false;

    // Show loading initially
    setLoadingUI();

    // Timeout fallback - if auth state doesn't resolve in 5 seconds, show welcome screen
    const authTimeout = setTimeout(() => {
      if (!authStateResolved) {
        authStateResolved = true;
        setSignedOutUI();
        authHint.textContent = "Taking too long? Check your internet connection or try refreshing.";
        authHint.style.color = "#b45309";
      }
    }, 5000);

    signInBtn.addEventListener("click", async () => {
      authHint.textContent = "";
      setLoadingUI();
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        let errorMessage = "Sign-in failed. Please try again.";
        const errorCode = err?.code || "";
        
        if (errorCode === "auth/unauthorized-domain") {
          errorMessage = "This domain is not authorized. Please add it in Firebase Console > Authentication > Settings > Authorized domains.";
        } else if (errorCode === "auth/popup-blocked") {
          errorMessage = "Popup was blocked. Please allow popups for this site and try again.";
        } else if (errorCode === "auth/popup-closed-by-user") {
          errorMessage = "Sign-in was cancelled. Click the button to try again.";
        } else if (errorCode === "auth/network-request-failed") {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (errorCode === "auth/cancelled-popup-request") {
          errorMessage = "";
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        if (errorMessage) {
          authHint.textContent = errorMessage;
          authHint.style.color = "#b91c1c";
        }
        setSignedOutUI();
      }
    });

    signOutBtn.addEventListener("click", async () => {
      authHint.textContent = "";
      setLoadingUI();
      try {
        await signOut(auth);
      } catch (err) {
        authHint.textContent = err?.message || "Sign-out failed.";
        authHint.style.color = "#b91c1c";
        setSignedOutUI();
      }
    });

    onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout);
      authStateResolved = true;
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

  // Handle page visibility changes (back button navigation)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentUserId) {
      // Re-render when user comes back to ensure UI is up to date
      renderAll();
    }
  });
});
