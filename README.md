# DarkBuddy

A Chrome extension that adds light/dark mode toggling capabilities to websites that don't natively support it. DarkBuddy uses CSS filters to intelligently invert colors while preserving media content like images and videos.

## Demo

https://github.com/user-attachments/assets/46b4430b-37b4-455d-94cb-a4382c61f4d7



## Features

- Toggle dark mode on any website with a single click
- Remembers your dark mode preference per domain
- Preserves original colors for images, videos, and other media content
- Fast initialization to prevent flash of unstyled content
- Works across tabs and persists across browser sessions

## Installation

Since this extension is not published on the Chrome Web Store, you'll need to install it manually in developer mode:

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" using the toggle in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files

## Usage

1. Click the DarkBuddy icon in your browser toolbar to toggle dark mode for the current site
2. The icon will show:
   - Dark icon: Site is currently in light mode (click to enable dark mode)
   - Light icon: Site is currently in dark mode (click to disable dark mode)

## Technical Details

DarkBuddy uses CSS filters and adoptedStyleSheets to implement dark mode, ensuring:
- Smooth transitions between modes
- Proper color inversion for content
- Preservation of media colors
- Early initialization to prevent flickering

## Known Limitations

- Some websites with complex styling or custom color schemes might not render perfectly in dark mode
- Dynamically loaded content might require a page refresh to apply dark mode correctly

## Contributing

Feel free to open issues or submit pull requests if you find bugs or have suggestions for improvements.

## License

This project is open source. Feel free to use and modify as needed.
