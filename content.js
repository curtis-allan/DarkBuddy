// Constants and configurations
const CONFIG = {
  TIMEOUT: 100,
  DOMAIN: window.location.hostname,
  STYLE_RULES: `
html[data-darkbuddy="enabled"] > body {
  filter: invert(0.9) hue-rotate(180deg);
  forced-color-adjust: none !important;

  & *:is(
  img,
  picture,
  canvas,
  iframe,
  video,
  [aria-hidden="true"],
  [style*='background-image'],
  [style*='']) {
    filter:invert(1) hue-rotate(180deg);
  }
}
  `,
};

// Cached stylesheet instance
let darkModeSheet = null;

// Utility functions
const getDarkModeSheet = () => {
  if (!darkModeSheet) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CONFIG.STYLE_RULES);
    darkModeSheet = sheet;
  }
  return darkModeSheet;
};

const setDarkBuddyState = (state) => {
  document.documentElement.dataset.darkbuddy = state;
};

// Dark mode management
const toggleDarkMode = (enabled) => {
  // Early return if state hasn't changed
  const sheet = getDarkModeSheet();
  const isDarkMode = document.adoptedStyleSheets.includes(sheet);
  if (enabled === isDarkMode) return;

  document.adoptedStyleSheets = enabled
    ? [...document.adoptedStyleSheets, sheet]
    : document.adoptedStyleSheets.filter((s) => s !== sheet);

  setDarkBuddyState(enabled ? "enabled" : "disabled");
};

// Initialization
const initializeEarly = async () => {
  try {
    const { darkModeSites = {} } =
      await chrome.storage.local.get("darkModeSites");

    if (!(CONFIG.DOMAIN in darkModeSites)) {
      setDarkBuddyState("disabled");
      return;
    }

    // If it's a registered site, we'll let the CSS handle the early dark background
    if (darkModeSites[CONFIG.DOMAIN]) {
      setDarkBuddyState("enabled");
    }
  } catch (err) {
    console.error("Early dark mode check failed:", err);
    setDarkBuddyState("error");
  }
};

const initialize = async () => {
  try {
    const { darkModeSites = {} } =
      await chrome.storage.local.get("darkModeSites");
    if (CONFIG.DOMAIN in darkModeSites) {
      toggleDarkMode(darkModeSites[CONFIG.DOMAIN]);
    } else {
      setDarkBuddyState("disabled");
    }
  } catch (err) {
    console.error("Dark mode initialization failed:", err);
    setDarkBuddyState("error");
  }
};

// Event handlers
const handleMessage = ({ type, enabled }) => {
  if (type === "TOGGLE_DARK_MODE") {
    toggleDarkMode(enabled);
  }
};

// Safety timeout
const setupTimeoutSafety = () => {
  setTimeout(() => {
    if (!document.documentElement.hasAttribute("data-darkbuddy")) {
      setDarkBuddyState("timeout");
    }
  }, CONFIG.TIMEOUT);
};

// Initialize
initializeEarly();
setupTimeoutSafety();

// Event listeners
chrome.runtime.onMessage.addListener(handleMessage);
if (document.readyState !== "complete") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
