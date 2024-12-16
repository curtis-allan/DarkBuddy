let currentState = null;
const root = document.documentElement;

const applyDarkMode = (enabled) => {
  if (currentState === enabled) return;
  currentState = enabled;
  if (enabled) {
    root.classList.add("darkbuddy-on");
  } else {
    root.classList.remove("darkbuddy-on");
  }
};

const initialize = async () => {
  try {
    const { darkModeSites = {} } =
      await chrome.storage.local.get("darkModeSites");
    const enabled = Boolean(darkModeSites[location.hostname]);
    applyDarkMode(enabled);
  } catch (err) {
    console.error("Failed to initialize dark mode:", err);
    applyDarkMode(false);
  } finally {
    root.style.visibility = "visible";
  }
};

// Listen for toggle messages from background.js
chrome.runtime.onMessage.addListener(({ type, enabled }) => {
  if (type === "TOGGLE_DARK_MODE") {
    applyDarkMode(enabled);
  }
});

initialize();
