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

const GENERIC_LABELS = new Set([
  "account",
  "your profile",
  "profile",
  "home",
  "watch",
  "marketplace",
  "groups",
  "gaming",
  "menu",
  "notifications",
  "messenger",
  "facebook",
  "你的个人主页",
  "您的个人主页",
  "个人主页",
  "更新个人主页",
  "编辑个人主页",
  "查看个人主页",
  "主页",
  "首页",
  "菜单",
  "通知",
  "小组",
  "帐户",
  "账号",
  "账户"
])

function normalizeName(value = "") {
  return value.replace(/\s+/g, " ").trim()
}

function cleanTitle(value = "") {
  return normalizeName(value)
    .replace(/^\(\d+\)\s*/, "")
    .replace(/^\d+\+\s*/, "")
    .replace(/\s*\|\s*Facebook\s*$/i, "")
    .replace(/\s*-\s*Facebook\s*$/i, "")
}

function isUsefulName(value = "") {
  const text = normalizeName(value)
  if (!text || text.length < 2 || text.length > 80) return false
  if (GENERIC_LABELS.has(text.toLowerCase())) return false
  if (/^(\(\d+\)\s*)?facebook$/i.test(text)) return false
  if (/^(facebook|meta business suite)$/i.test(text)) return false
  if (/^(see all|view all|manage|settings|create|edit|update)$/i.test(text)) return false
  if (/^(查看全部|管理|设置|创建|编辑|更新)$/.test(text)) return false
  if (/更新个人主页|你的个人主页|您的个人主页/.test(text)) return false
  return true
}

function titleCandidate() {
  const metaTitle = cleanTitle(document.querySelector('meta[property="og:title"]')?.content)
  if (isUsefulName(metaTitle)) return normalizeName(metaTitle)

  const pageTitle = cleanTitle(document.title)
  if (isUsefulName(pageTitle)) return normalizeName(pageTitle)

  return ""
}

function profileSlugCandidate() {
  const firstPathPart = decodeURIComponent(location.pathname.split("/").filter(Boolean)[0] || "")
  const badPathParts = new Set([
    "",
    "pages",
    "groups",
    "watch",
    "marketplace",
    "events",
    "friends",
    "notifications",
    "messages",
    "login",
    "checkpoint",
    "business"
  ])
  if (badPathParts.has(firstPathPart.toLowerCase())) return ""
  if (!/^[a-z0-9_.-]{3,}$/i.test(firstPathPart)) return ""
  return `@${firstPathPart}`
}

function readAccountName() {
  const fromTitle = titleCandidate()
  if (fromTitle) return fromTitle

  const candidates = [
    document.querySelector('[role="main"] h1'),
    document.querySelector('h1'),
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
    const text = normalizeName(aria || readText(candidate))
    if (isUsefulName(text)) return text
  }

  return profileSlugCandidate()
}

function readPages() {
  const anchors = [...document.querySelectorAll("a[href]")]
  const isPagesDirectory =
    location.pathname.includes("/pages") ||
    location.hostname.includes("business.facebook.com") ||
    location.href.includes("business.facebook.com/latest")

  const pageCandidates = anchors
    .map(anchor => {
      const href = anchor.href
      const text = normalizeName(readText(anchor) || anchor.getAttribute("aria-label") || "")
      const url = new URL(href, location.href)
      const profileId = url.searchParams.get("profile_id")
      const pageId = url.searchParams.get("id")
      const path = url.pathname
      const looksLikePage =
        isPagesDirectory &&
        (
          href.includes("/pages/") ||
          href.includes("/pages/?") ||
          href.includes("/pages/manage") ||
          href.includes("/pages/?category=") ||
          href.includes("/latest/home") ||
          href.includes("/latest/posts") ||
          href.includes("business.facebook.com/latest/home") ||
          profileId ||
          pageId
        )

      const looksLikeDirectoryOnly =
        href.includes("/pages/?") ||
        href.includes("/pages/manage") ||
        href.includes("/pages/?category=")

      if (!looksLikePage || looksLikeDirectoryOnly || !isUsefulName(text)) return null

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
  const isPagesDirectory =
    location.pathname.includes("/pages") ||
    location.hostname.includes("business.facebook.com") ||
    location.href.includes("business.facebook.com/latest")
  const pages = readPages()

  return {
    connected: isFacebook && Boolean(document.body) && !/login|checkpoint/i.test(location.pathname),
    profileName: "",
    accountName: readAccountName(),
    pages,
    pagesHint: pages.length || isPagesDirectory ? "" : "Open Pages Manager to read pages",
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
