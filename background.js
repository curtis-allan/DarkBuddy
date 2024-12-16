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

// Cached storage data
let cachedDarkModeSites = {};

const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const getStorageData = async () => {
  if (Object.keys(cachedDarkModeSites).length === 0) {
    const data = await chrome.storage.local.get("darkModeSites");
    cachedDarkModeSites = data.darkModeSites || {};
  }
  return cachedDarkModeSites;
};

// Update icon based on domain's dark mode state
const updateIcon = async (tabId, domain) => {
  if (!domain) return;
  const darkModeSites = await getStorageData();
  const isDark = darkModeSites[domain] || false;
  const currentIcon = isDark ? ICONS.LIGHT : ICONS.DARK;

  await chrome.action.setIcon({
    tabId,
    path: currentIcon,
  });
};

// Toggle dark mode for a domain
const toggleDarkMode = async (tab) => {
  const domain = getDomain(tab.url);
  if (!domain) return;

  const darkModeSites = await getStorageData();
  const currentState = darkModeSites[domain] || false;
  const newState = !currentState;

  const updatedSites = {
    ...darkModeSites,
    [domain]: newState,
  };

  try {
    await chrome.storage.local.set({ darkModeSites: updatedSites });
    cachedDarkModeSites = updatedSites; // Update cache

    chrome.action.setIcon({
      tabId: tab.id,
      path: newState ? ICONS.LIGHT : ICONS.DARK,
    });

    chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_DARK_MODE",
      enabled: newState,
    });
  } catch (err) {
    console.error(`ERROR: ${err}`);
  }
};

// Event handlers
const handleActionClick = async (tab) => {
  if (!tab?.url || !tab.id) return;
  try {
    await toggleDarkMode(tab);
  } catch (err) {
    console.error("Error toggling dark mode:", err);
  }
};

const handleTabUpdate = async (tabId, changeInfo, tab) => {
  if (
    tab.url &&
    (changeInfo.status === "loading" || changeInfo.status === "complete")
  ) {
    const domain = getDomain(tab.url);
    await updateIcon(tabId, domain);
  }
};

const handleTabActivated = async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url) {
      const domain = getDomain(tab.url);
      await updateIcon(tabId, domain);
    }
  } catch (err) {
    console.error("Error in tab activation:", err);
  }
};

// Initialize all existing tabs
const initializeExtension = async () => {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.url && tab.id) {
      const domain = getDomain(tab.url);
      await updateIcon(tab.id, domain);
    }
  }
};

// Listen for storage changes to update cache
chrome.storage.onChanged.addListener((changes) => {
  if (changes.darkModeSites) {
    cachedDarkModeSites = changes.darkModeSites.newValue || {};
  }
});

// Event listeners
chrome.action.onClicked.addListener(handleActionClick);
chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.runtime.onInstalled.addListener(initializeExtension);
initializeExtension();
