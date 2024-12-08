// Optimize performance by caching document root
const root = document.documentElement;
let currentState = null;

// Simplified setDarkMode without stylesheet management
const setDarkMode = async (enabled) => {
  if (currentState === enabled) return;
  currentState = enabled;
  root.dataset.darkMode = enabled;
};

// Initialize as soon as possible
const initialize = async () => {
  try {
    const { darkModeSites = {} } =
      await chrome.storage.local.get("darkModeSites");
    setDarkMode(darkModeSites[location.hostname] || false);
  } catch (err) {
    console.error("Failed to initialize dark mode:", err);
    setDarkMode(false);
  }
};

// Message handler
chrome.runtime.onMessage.addListener(({ type, enabled }) => {
  if (type === "TOGGLE_DARK_MODE") {
    setDarkMode(enabled);
  }
});

initialize();
