const connectedText = document.getElementById("connectedText")
const profileName = document.getElementById("profileName")
const accountName = document.getElementById("accountName")
const pagesText = document.getElementById("pagesText")
const statusDot = document.getElementById("statusDot")
const logsPanel = document.getElementById("logsPanel")
const logsOutput = document.getElementById("logsOutput")

function formatTime(value) {
  const date = new Date(value)
  return date.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3
  })
}

function renderLogs(logs) {
  logsOutput.textContent = logs
    .slice(-80)
    .map(entry => {
      const meta = entry.meta && Object.keys(entry.meta).length
        ? ` ${JSON.stringify(entry.meta)}`
        : ""
      return `${formatTime(entry.time)} ${entry.level.padEnd(5)} ${entry.message}${meta}`
    })
    .join("\n")
}

async function send(message) {
  return chrome.runtime.sendMessage(message)
}

async function refresh() {
  const response = await send({ type: "FB_PUBLISHER_GET_STATE" })
  if (!response?.ok) return

  const state = response.publisherState
  statusDot.classList.toggle("connected", state.connected)
  connectedText.textContent = state.connected ? "Connected" : "Disconnected"
  profileName.textContent = state.profileName || "-"
  accountName.textContent = state.accountName || "-"
  pagesText.textContent = state.pages?.length
    ? state.pages.map(page => page.name).join(", ")
    : "-"
  renderLogs(response.logs || [])
}

async function refreshActiveTab() {
  await send({ type: "FB_PUBLISHER_REFRESH_ACTIVE_TAB" })
  await refresh()
}

document.getElementById("settingsButton").addEventListener("click", () => {
  chrome.runtime.openOptionsPage()
})

document.getElementById("logsButton").addEventListener("click", () => {
  logsPanel.classList.toggle("hidden")
})

document.getElementById("clearLogsButton").addEventListener("click", async () => {
  await send({ type: "FB_PUBLISHER_CLEAR_LOGS" })
  await refresh()
})

document.getElementById("adminHubButton").addEventListener("click", async () => {
  const response = await send({ type: "FB_PUBLISHER_GET_STATE" })
  const url = response?.settings?.adminHubUrl || "https://daily-prayer.us"
  chrome.tabs.create({ url })
})

document.getElementById("refreshButton").addEventListener("click", refreshActiveTab)

refreshActiveTab().catch(() => refresh())
setInterval(refresh, 1500)
