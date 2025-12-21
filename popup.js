const timerEl = document.getElementById("timer");
const stateEl = document.getElementById("state");
const resetBtn = document.getElementById("reset");

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
    ? "Contando enquanto o X.com está em foco."
    : "Pausado: abra o X.com na aba ativa.";
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

refresh();
setInterval(refresh, 1000);
