// Create and cache stylesheet immediately at script load
const darkModeSheet = new CSSStyleSheet();
darkModeSheet.replaceSync(`
html[data-dark-mode="true"] {
  color-scheme: dark;
}

html[data-dark-mode="true"] > body {
  filter: invert(0.9) hue-rotate(180deg);
  backface-visibility: hidden; /* Reduces paint time */
  transform: translateZ(0); /* Forces GPU acceleration */
  will-change: transform; /* Hints browser about animations */
  forced-color-adjust: none !important;
}

/* Separate rule for media to optimize paint performance */
html[data-dark-mode="true"] > body :is(
  img:not([aria-hidden="true"]),
  picture,
  video,
  canvas,
  [style*="background-image"]
) {
  filter: invert(1) hue-rotate(180deg);
  backface-visibility: hidden;
}

/* Special handling for iframes to prevent double inversion */
html[data-dark-mode="true"] > body iframe {
  filter: invert(1) hue-rotate(180deg);
  backface-visibility: hidden;
  isolation: isolate;
}`);

// Optimize performance by caching document root
const root = document.documentElement;
let currentState = null;

// Optimized state management
const setDarkMode = (enabled) => {
  // Prevent unnecessary updates
  if (currentState === enabled) return;

  currentState = enabled;
  root.dataset.darkMode = enabled;

  // Batch DOM operations
  requestAnimationFrame(() => {
    const sheets = document.adoptedStyleSheets;
    document.adoptedStyleSheets = enabled
      ? [...sheets, darkModeSheet]
      : sheets.filter((s) => s !== darkModeSheet);
  });
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

// Optimized message handler
chrome.runtime.onMessage.addListener(({ type, enabled }) => {
  if (type === "TOGGLE_DARK_MODE") {
    setDarkMode(enabled);
  }
});

// Start initialization immediately
initialize();
