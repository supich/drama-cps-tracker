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
  const metaTitle = document.querySelector('meta[property="og:title"]')?.content
  if (metaTitle && !/Facebook/i.test(metaTitle) && metaTitle.length < 80) {
    return metaTitle
  }

  const candidates = [
    document.querySelector('[aria-label*="Account"]'),
    document.querySelector('[aria-label*="Your profile"]'),
    document.querySelector('[aria-label*="个人主页"]'),
    document.querySelector('[aria-label*="帐户"]'),
    document.querySelector('[aria-label*="账号"]'),
    document.querySelector('[aria-label*="账户"]'),
    document.querySelector('[role="banner"] a[aria-label]'),
    document.querySelector('a[href*="/me/"]'),
    document.querySelector('a[href*="profile.php"]')
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
  const badNames = new Set([
    "home",
    "watch",
    "marketplace",
    "groups",
    "gaming",
    "menu",
    "notifications",
    "messenger",
    "facebook",
    "主页",
    "首页",
    "菜单",
    "通知",
    "小组"
  ])
  const pageCandidates = anchors
    .map(anchor => {
      const href = anchor.href
      const text = readText(anchor)
      const profileId = new URL(href, location.href).searchParams.get("profile_id")
      const pageId = new URL(href, location.href).searchParams.get("id")
      const path = new URL(href, location.href).pathname
      const looksLikePage =
        href.includes("/pages/") ||
        href.includes("/pages/?") ||
        href.includes("/pages/manage") ||
        href.includes("/pages/?category=") ||
        href.includes("/profile.php?id=") ||
        href.includes("/latest/home") ||
        href.includes("/latest/posts") ||
        href.includes("profile_id=") ||
        href.includes("business.facebook.com/latest/home")

      if (!looksLikePage || !text || text.length < 2 || text.length > 80) return null
      if (badNames.has(text.toLowerCase())) return null

      return {
        id: profileId || pageId || path || href,
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
    connected: isFacebook && Boolean(document.body) && !/login|checkpoint/i.test(location.pathname),
    profileName: "",
    accountName: readAccountName(),
    pages,
    url: location.href
  }
}

var lastStateJson = window.__dramaCpsFbPublisherLastStateJson || ""

async function sendState() {
  const state = collectState()
  const stateJson = JSON.stringify(state)
  if (stateJson === lastStateJson) return
  lastStateJson = stateJson
  window.__dramaCpsFbPublisherLastStateJson = stateJson

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

if (!window.__dramaCpsFbPublisherMessageListeners) {
  window.__dramaCpsFbPublisherMessageListeners = true

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

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "FB_PUBLISHER_COLLECT_NOW") {
      sendResponse(collectState())
    }
    return false
  })
}

sendState()
if (!window.__dramaCpsFbPublisherObserver) {
  window.__dramaCpsFbPublisherObserver = true
  setInterval(sendState, 5000)
  new MutationObserver(() => sendState()).observe(document.documentElement, {
    childList: true,
    subtree: true
  })
}
