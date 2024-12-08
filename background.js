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

// Utility functions
const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const getStorageData = async () => {
  const { darkModeSites = {} } =
    await chrome.storage.local.get("darkModeSites");
  return darkModeSites;
};

// Update icon based on domain's dark mode state
const updateIcon = async (tabId, domain) => {
  if (!domain) return;

  const darkModeSites = await getStorageData();
  const isDark = darkModeSites[domain] || false;

  await chrome.action.setIcon({
    tabId,
    path: isDark ? ICONS.LIGHT : ICONS.DARK,
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

  await Promise.all([
    chrome.action.setIcon({
      tabId: tab.id,
      path: newState ? ICONS.LIGHT : ICONS.DARK,
    }),
    chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_DARK_MODE",
      enabled: newState,
    }),
    chrome.storage.local.set({ darkModeSites: updatedSites }),
  ]);
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
  // Handle both initial load and subsequent navigations
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

// Event listeners
chrome.action.onClicked.addListener(handleActionClick);
chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onUpdated.addListener(handleTabUpdate);

// Initialize on install/update
chrome.runtime.onInstalled.addListener(initializeExtension);
// Initialize when service worker starts
initializeExtension();
