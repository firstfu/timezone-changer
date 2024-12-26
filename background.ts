import { Storage } from "@plasmohq/storage"

import type { StoredTimezone } from "~types"

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

  if (request.type === "UPDATE_TIMEZONE") {
    // 獲取所有標籤頁
    chrome.tabs.query({}, (tabs) => {
      Promise.all(
        tabs.map((tab) => {
          if (tab.id) {
            return chrome.tabs
              .sendMessage(tab.id, {
                type: "SET_TIMEZONE",
                timezone: request.timezone
              })
              .catch(() => {
                // 忽略無法發送消息的標籤頁
                console.log(`無法更新標籤頁 ${tab.id} 的時區`)
              })
          }
        })
      )
        .then(() => {
          // 保存當前時區到 storage
          return storage.set("currentTimezone", {
            id: request.timezone,
            timestamp: Date.now()
          })
        })
        .then(() => {
          sendResponse({ success: true })
        })
        .catch((error) => {
          console.error("更新時區失敗:", error)
          sendResponse({ success: false, error: error.message })
        })
    })
    return true
  }
})

// 監聽標籤頁更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    try {
      const currentTimezone =
        await storage.get<StoredTimezone>("currentTimezone")
      if (currentTimezone?.id) {
        chrome.tabs.sendMessage(tabId, {
          type: "SET_TIMEZONE",
          timezone: currentTimezone.id
        })
      }
    } catch (error) {
      console.error("恢復時區失敗:", error)
    }
  }
})
