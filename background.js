const STORAGE_KEY = "xTimeState";
const X_HOSTS = ["x.com", "www.x.com"];

let state = {
  totalMs: 0,
  running: false,
  lastStart: null,
  tabId: null,
};

const now = () => Date.now();

const isXUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    return X_HOSTS.includes(hostname) || hostname.endsWith(".x.com");
  } catch (err) {
    return false;
  }
};

const loadState = async () => {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  if (stored[STORAGE_KEY]) {
    state = { ...state, ...stored[STORAGE_KEY] };
  }
};

const persistState = async () => {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
};

const stopTimer = async (reason) => {
  if (!state.running || state.lastStart === null) return;
  const elapsed = now() - state.lastStart;
  state.totalMs += elapsed;
  state.running = false;
  state.lastStart = null;
  state.tabId = null;
  await persistState();
  console.debug("Stopped tracking:", reason);
};

const startTimer = async (tabId, reason) => {
  if (state.running && state.tabId === tabId) return;
  if (state.running && state.tabId !== tabId) {
    await stopTimer("switching-tab");
  }
  state.running = true;
  state.lastStart = now();
  state.tabId = tabId;
  await persistState();
  console.debug("Started tracking:", reason, "tab", tabId);
};

const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
};

const getWindow = async (windowId) => {
  try {
    return await chrome.windows.get(windowId);
  } catch (err) {
    return null;
  }
};

const handleContextChange = async (reason) => {
  const tab = await getActiveTab();
  if (!tab) {
    await stopTimer(reason);
    return;
  }

  const win = await getWindow(tab.windowId);
  const focused = Boolean(win?.focused);
  const shouldTrack = focused && tab.active && isXUrl(tab.url);

  if (shouldTrack) {
    await startTimer(tab.id, reason);
  } else {
    await stopTimer(reason);
  }
};

const safeGetTab = async (tabId) => {
  try {
    return await chrome.tabs.get(tabId);
  } catch (err) {
    return null;
  }
};

const restoreTracking = async () => {
  await loadState();
  if (state.running && state.tabId !== null && state.lastStart !== null) {
    const tab = await safeGetTab(state.tabId);
    const win = tab ? await getWindow(tab.windowId) : null;
    const shouldTrack = tab && win?.focused && tab.active && isXUrl(tab.url);
    if (!shouldTrack) {
      await stopTimer("restore-stop");
    }
  }
  await handleContextChange("startup");
};

chrome.tabs.onActivated.addListener(() => handleContextChange("tab-activated"));
chrome.windows.onFocusChanged.addListener(() =>
  handleContextChange("window-focus")
);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    handleContextChange("url-changed");
  }
});
chrome.tabs.onRemoved.addListener((tabId) => {
  if (state.tabId === tabId) {
    stopTimer("tab-removed");
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const respond = async () => {
    if (request.type === "getStatus") {
      const runningElapsed =
        state.running && state.lastStart ? now() - state.lastStart : 0;
      sendResponse({
        totalMs: state.totalMs + runningElapsed,
        running: state.running,
        lastStart: state.lastStart,
      });
      return;
    }

    if (request.type === "reset") {
      state.totalMs = 0;
      if (state.running) {
        state.lastStart = now();
      }
      await persistState();
      sendResponse({ ok: true });
      return;
    }
  };

  respond();
  return true;
});

restoreTracking();
