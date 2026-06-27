const DEFAULT_STATE = {
  connected: false,
  profileName: "",
  accountName: "",
  pages: [],
  activeUrl: "",
  lastSeenAt: null
}

async function getState() {
  const data = await chrome.storage.local.get(["publisherState", "logs", "settings"])
  return {
    publisherState: { ...DEFAULT_STATE, ...(data.publisherState || {}) },
    logs: data.logs || [],
    settings: data.settings || {}
  }
}

async function appendLog(level, message, meta = {}) {
  const { logs } = await getState()
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    meta
  }
  const nextLogs = [...logs, entry].slice(-300)
  await chrome.storage.local.set({ logs: nextLogs })
  return entry
}

function isFacebookUrl(url = "") {
  try {
    const { hostname } = new URL(url)
    return /(^|\.)facebook\.com$/.test(hostname) ||
      /(^|\.)business\.facebook\.com$/.test(hostname)
  } catch {
    return false
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

async function askTabForState(tab) {
  if (!tab?.id || !isFacebookUrl(tab.url)) {
    return {
      connected: false,
      profileName: "",
      accountName: "",
      pages: [],
      activeUrl: tab?.url || "",
      lastSeenAt: new Date().toISOString()
    }
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, { type: "FB_PUBLISHER_COLLECT_NOW" })
  } catch (error) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-script.js"]
    })
    return chrome.tabs.sendMessage(tab.id, { type: "FB_PUBLISHER_COLLECT_NOW" })
  }
}

async function updateStateFromActiveTab() {
  const tab = await getActiveTab()
  const { settings } = await getState()
  const payload = await askTabForState(tab)
  const state = {
    connected: Boolean(payload.connected),
    profileName: settings.profileName || payload.profileName || "",
    accountName: payload.accountName || "",
    pages: Array.isArray(payload.pages) ? payload.pages : [],
    activeUrl: tab?.url || payload.url || "",
    lastSeenAt: new Date().toISOString()
  }
  await chrome.storage.local.set({ publisherState: state })
  await appendLog(state.connected ? "info" : "warn", "Active tab state refreshed", {
    activeUrl: state.activeUrl,
    accountName: state.accountName,
    pages: state.pages.map(page => page.name)
  })
  return state
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    publisherState: DEFAULT_STATE,
    logs: [],
    settings: {
      adminHubUrl: "https://daily-prayer.us",
      profileName: ""
    }
  })
  await appendLog("info", "Extension installed")
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ;(async () => {
    if (message?.type === "FB_PUBLISHER_PAGE_STATE") {
      const { settings } = await getState()
      const state = {
        connected: Boolean(message.payload?.connected),
        profileName: settings.profileName || message.payload?.profileName || "",
        accountName: message.payload?.accountName || "",
        pages: Array.isArray(message.payload?.pages) ? message.payload.pages : [],
        activeUrl: sender.tab?.url || "",
        lastSeenAt: new Date().toISOString()
      }
      await chrome.storage.local.set({ publisherState: state })
      await appendLog("info", "Page state updated", {
        pages: state.pages.map(page => page.name),
        accountName: state.accountName,
        activeUrl: state.activeUrl
      })
      sendResponse({ ok: true })
      return
    }

    if (message?.type === "FB_PUBLISHER_LOG") {
      const entry = await appendLog(message.level || "info", message.message || "", message.meta || {})
      sendResponse({ ok: true, entry })
      return
    }

    if (message?.type === "FB_PUBLISHER_GET_STATE") {
      sendResponse({ ok: true, ...(await getState()) })
      return
    }

    if (message?.type === "FB_PUBLISHER_REFRESH_ACTIVE_TAB") {
      const state = await updateStateFromActiveTab()
      sendResponse({ ok: true, state, ...(await getState()) })
      return
    }

    if (message?.type === "FB_PUBLISHER_CLEAR_LOGS") {
      await chrome.storage.local.set({ logs: [] })
      sendResponse({ ok: true })
      return
    }

    if (message?.type === "FB_PUBLISHER_SAVE_SETTINGS") {
      const { settings } = await getState()
      await chrome.storage.local.set({
        settings: {
          ...settings,
          ...(message.settings || {})
        }
      })
      await appendLog("info", "Settings saved")
      sendResponse({ ok: true })
      return
    }

    sendResponse({ ok: false, error: "Unknown message type" })
  })().catch(error => {
    sendResponse({ ok: false, error: error.message })
  })

  return true
})
