const adminHubUrl = document.getElementById("adminHubUrl")
const profileName = document.getElementById("profileName")
const status = document.getElementById("status")

async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ type: "FB_PUBLISHER_GET_STATE" })
  const settings = response?.settings || {}
  adminHubUrl.value = settings.adminHubUrl || "https://daily-prayer.us"
  profileName.value = settings.profileName || ""
}

document.getElementById("saveButton").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    type: "FB_PUBLISHER_SAVE_SETTINGS",
    settings: {
      adminHubUrl: adminHubUrl.value.trim(),
      profileName: profileName.value.trim()
    }
  })
  status.textContent = "Saved"
  setTimeout(() => {
    status.textContent = ""
  }, 2000)
})

loadSettings()
