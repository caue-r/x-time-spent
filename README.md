# X Time Spent

Chrome extension that tracks how long you actively spend on X.com and shows a live counter in the popup.

## Features
- Tracks only when an X.com tab is focused in the active window.
- Persists total time across browser restarts.
- Light/dark toggle and one-click reset.

## Install (Chrome)
1) Clone or download this folder.
2) Open `chrome://extensions`, enable **Developer mode**.
3) Click **Load unpacked** and select the project folder.

## Usage
- Open X.com in a tab; the popup shows a running total while the tab is active and focused.
- Use the reset button to clear the timer.
- Theme toggle switches between light and dark modes.

## Privacy
Data is stored only in your browser via `chrome.storage.local`; nothing is sent anywhere else.
