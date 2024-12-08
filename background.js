// Constants
const ICONS = {
  LIGHT: {
    16: "icons/light-16.png",
    32: "icons/light-32.png",
    48: "icons/light-48.png",
    128: "icons/light-128.png",
  },
  DARK: {
    16: "icons/dark-16.png",
    32: "icons/dark-32.png",
    48: "icons/dark-48.png",
    128: "icons/dark-128.png",
  },
};

// State tracking
let isToggling = false;
let currentDomain = null;

// Utility functions
const getDomain = (url) => new URL(url).hostname;

const getStorageData = async () => {
  const { darkModeSites = {} } =
    await chrome.storage.local.get("darkModeSites");
  return darkModeSites;
};

// Combined update function that either completes fully or not at all
const toggleDarkMode = async (tab) => {
  const domain = getDomain(tab.url);
  const darkModeSites = await getStorageData();

  // For new sites, assume they're starting in light mode (false)
  const currentState = domain in darkModeSites ? darkModeSites[domain] : false;
  const newState = !currentState;

  const updatedSites = {
    ...darkModeSites,
    [domain]: newState,
  };

  // All operations that need to succeed
  const updates = [
    chrome.action.setIcon({
      tabId: tab.id,
      path: newState ? ICONS.LIGHT : ICONS.DARK,
    }),
    chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_DARK_MODE",
      enabled: newState,
    }),
    chrome.storage.local.set({ darkModeSites: updatedSites }),
  ];

  await Promise.all(updates);
};

// Protected click handler
const handleActionClick = async (tab) => {
  if (!tab?.url || !tab.id || isToggling) return;

  try {
    isToggling = true;
    await toggleDarkMode(tab);
  } catch (err) {
    console.error("Error toggling dark mode:", err);
  } finally {
    isToggling = false;
  }
};

// Domain-aware tab management
const handleTabChange = async (tab) => {
  if (!tab?.url || !tab.id) return;

  const newDomain = getDomain(tab.url);

  // Only update icon if we've changed domains
  if (newDomain !== currentDomain) {
    try {
      currentDomain = newDomain;
      const darkModeSites = await getStorageData();
      const isDark =
        newDomain in darkModeSites ? darkModeSites[newDomain] : false;

      await chrome.action.setIcon({
        tabId: tab.id,
        path: isDark ? ICONS.LIGHT : ICONS.DARK,
      });
    } catch (err) {
      console.error("Error handling tab change:", err);
    }
  }
};

const handleTabActivation = async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    await handleTabChange(tab);
  } catch (err) {
    console.error("Error in tab activation:", err);
  }
};

const handleTabUpdate = async (tabId, changeInfo, tab) => {
  // Only check on complete and only if it's a navigation (url change)
  if (changeInfo.status === "complete" && changeInfo.url) {
    await handleTabChange(tab);
  }
};

// Initialize extension
const initializeExtension = async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    await handleTabChange(tab);
  }
};

// Event listeners
chrome.tabs.onActivated.addListener(handleTabActivation);
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.action.onClicked.addListener(handleActionClick);

// Initialize on load
initializeExtension();
