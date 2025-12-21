const timerEl = document.getElementById("timer");
const stateEl = document.getElementById("state");
const resetBtn = document.getElementById("reset");
const themeToggleBtn = document.getElementById("theme-toggle");

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const setTimer = (ms, running) => {
  timerEl.textContent = formatTime(ms);
  stateEl.textContent = running
    ? "Tracking while X.com is in focus."
    : "Paused: open X.com in the active tab.";
};

const fetchStatus = () =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "getStatus" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        resolve({ totalMs: 0, running: false });
        return;
      }
      resolve(response);
    });
  });

const refresh = async () => {
  const { totalMs, running } = await fetchStatus();
  setTimer(totalMs, running);
};

resetBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "reset" }, () => {
    refresh();
  });
});

const applyTheme = (theme) => {
  if (theme === "light") {
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
  }
};

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = localStorage.getItem("theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
});

const loadTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);
};

loadTheme();
refresh();
setInterval(refresh, 1000);
