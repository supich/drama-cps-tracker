function uniqBy(items, keyFn) {
  const map = new Map()
  for (const item of items) {
    const key = keyFn(item)
    if (key && !map.has(key)) map.set(key, item)
  }
  return [...map.values()]
}

function readText(element) {
  return (element?.innerText || element?.textContent || "").replace(/\s+/g, " ").trim()
}

function readAccountName() {
  const candidates = [
    document.querySelector('[aria-label*="Account"]'),
    document.querySelector('[aria-label*="Your profile"]'),
    document.querySelector('[role="banner"] a[aria-label]'),
    document.querySelector('a[href*="/me/"]')
  ]

  for (const candidate of candidates) {
    const aria = candidate?.getAttribute?.("aria-label")
    const text = aria || readText(candidate)
    if (text && text.length < 80) return text
  }

  return ""
}

function readPages() {
  const anchors = [...document.querySelectorAll("a[href]")]
  const pageCandidates = anchors
    .map(anchor => {
      const href = anchor.href
      const text = readText(anchor)
      const profileId = new URL(href, location.href).searchParams.get("profile_id")
      const looksLikePage =
        href.includes("/pages/") ||
        href.includes("profile_id=") ||
        href.includes("business.facebook.com/latest/home")

      if (!looksLikePage || !text || text.length < 2 || text.length > 80) return null

      return {
        id: profileId || href,
        name: text,
        url: href
      }
    })
    .filter(Boolean)

  return uniqBy(pageCandidates, page => `${page.id}:${page.name}`).slice(0, 30)
}

function collectState() {
  const isFacebook = /(^|\.)facebook\.com$/.test(location.hostname) ||
    /(^|\.)business\.facebook\.com$/.test(location.hostname)
  const pages = readPages()

  return {
    connected: isFacebook && Boolean(document.body),
    profileName: "",
    accountName: readAccountName(),
    pages,
    url: location.href
  }
}

let lastStateJson = ""

async function sendState() {
  const state = collectState()
  const stateJson = JSON.stringify(state)
  if (stateJson === lastStateJson) return
  lastStateJson = stateJson

  try {
    await chrome.runtime.sendMessage({
      type: "FB_PUBLISHER_PAGE_STATE",
      payload: state
    })
  } catch {
    // The extension runtime can be temporarily unavailable during reloads.
  }
}

function log(message, meta = {}) {
  chrome.runtime.sendMessage({
    type: "FB_PUBLISHER_LOG",
    level: "info",
    message,
    meta
  }).catch(() => {})
}

window.addEventListener("message", event => {
  if (event.source !== window) return
  if (event.data?.source !== "DRAMA_CPS_GATEWAY") return

  if (event.data.type === "FB_PUBLISHER_COLLECT_STATE") {
    window.postMessage({
      source: "DRAMA_CPS_EXTENSION",
      type: "FB_PUBLISHER_STATE",
      payload: collectState()
    }, "*")
  }

  if (event.data.type === "FB_PUBLISHER_LOG") {
    log(event.data.message || "Gateway event", event.data.meta || {})
  }
})

sendState()
setInterval(sendState, 5000)
new MutationObserver(() => sendState()).observe(document.documentElement, {
  childList: true,
  subtree: true
})
