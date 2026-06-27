# Drama CPS FB Publisher Extension

This extension is the browser-side helper for the browser UI publishing workflow.

It intentionally does not call Facebook private GraphQL, `fb_dtsg`, or internal upload endpoints. The extension is responsible for:

- Showing the connected state, profile name, account name, and discovered pages.
- Reading visible Facebook / Business Suite page state from the current tab.
- Keeping a local operation log similar to the reference plugin.
- Exposing a page-message bridge for a local Automation Gateway.

The local Automation Gateway should handle AdsPower, Playwright/CDP, file uploads, and Facebook UI operations.

## Load Locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select this `browser-extension` directory.
5. Open Facebook or Meta Business Suite in the same browser profile.

## Message Bridge

The content script listens for messages posted by a Gateway:

```js
window.postMessage({ source: "DRAMA_CPS_GATEWAY", type: "FB_PUBLISHER_COLLECT_STATE" }, "*")
```

It replies:

```js
window.addEventListener("message", event => {
  if (event.data?.source === "DRAMA_CPS_EXTENSION") {
    console.log(event.data.payload)
  }
})
```

Gateway logs can be forwarded into the extension:

```js
window.postMessage({
  source: "DRAMA_CPS_GATEWAY",
  type: "FB_PUBLISHER_LOG",
  message: "upload started",
  meta: { stage: "upload" }
}, "*")
```

## Next Step

Connect a local Gateway that opens AdsPower profiles, attaches Playwright/CDP to the browser, and drives the official Facebook / Business Suite publisher UI.
