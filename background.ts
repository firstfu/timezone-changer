import { Storage } from "@plasmohq/storage"

const storage = new Storage({
  area: "local"
})

// 預加載時區數據
const preloadTimezones = async () => {
  try {
    const now = new Date()
    const timezones = Intl.supportedValuesOf("timeZone").map((tz) => ({
      id: tz,
      name: tz.replace(/_/g, " "),
      offset: now
        .toLocaleString("en-US", { timeZone: tz, timeZoneName: "longOffset" })
        .split(" ")
        .pop(),
      abbr: now
        .toLocaleString("en-US", { timeZone: tz, timeZoneName: "short" })
        .split(" ")
        .pop(),
      isDST: false,
      isSystem: false
    }))

    await storage.set("allTimezones", timezones)
  } catch (error) {
    console.error("Failed to preload timezones:", error)
  }
}

// 在擴展啟動時預加載數據
chrome.runtime.onInstalled.addListener(() => {
  preloadTimezones()

  // 創建右鍵選單
  chrome.contextMenus.create({
    id: "timezone-changer",
    title: "時區切換器",
    contexts: ["all"]
  })
})

// 在擴展啟動時預加載數據
chrome.runtime.onStartup.addListener(() => {
  preloadTimezones()
})

// 處理右鍵選單點擊
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "timezone-changer") {
    chrome.action.openPopup()
  }
})

// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_CURRENT_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      sendResponse(tab)
    })
    return true
  }
})
