// 定義時區信息類型
interface TimezoneInfo {
  id: string
  name: string
  offset: string
  abbr: string
  isDST: boolean
  isSystem: boolean
}

// 在擴展啟動時初始化
chrome.runtime.onStartup.addListener(async () => {
  try {
    // 檢查是否有保存的時區設置
    const result = await chrome.storage.local.get("currentTimezone")
    if (!result.currentTimezone) {
      // 如果沒有保存的時區，設置系統時區作為默認值
      const systemTimezone: TimezoneInfo = {
        id: Intl.DateTimeFormat().resolvedOptions().timeZone,
        name: Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone.replace(/_/g, " "),
        offset:
          new Date()
            .toLocaleString("en-US", { timeZoneName: "longOffset" })
            .split(" ")
            .pop() || "",
        abbr:
          new Date()
            .toLocaleString("en-US", { timeZoneName: "short" })
            .split(" ")
            .pop() || "",
        isDST: false,
        isSystem: true
      }
      await chrome.storage.local.set({ currentTimezone: systemTimezone })
    }
  } catch (error) {
    console.error("Failed to initialize timezone:", error)
  }
})

// 在擴展安裝或更新時初始化
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // 檢查是否有保存的時區設置
    const result = await chrome.storage.local.get("currentTimezone")
    if (!result.currentTimezone) {
      // 如果沒有保存的時區，設置系統時區作為默認值
      const systemTimezone: TimezoneInfo = {
        id: Intl.DateTimeFormat().resolvedOptions().timeZone,
        name: Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone.replace(/_/g, " "),
        offset:
          new Date()
            .toLocaleString("en-US", { timeZoneName: "longOffset" })
            .split(" ")
            .pop() || "",
        abbr:
          new Date()
            .toLocaleString("en-US", { timeZoneName: "short" })
            .split(" ")
            .pop() || "",
        isDST: false,
        isSystem: true
      }
      await chrome.storage.local.set({ currentTimezone: systemTimezone })
    }
  } catch (error) {
    console.error("Failed to initialize timezone:", error)
  }
})

// 監聽標籤頁更新
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    try {
      // 使用 Chrome Storage API
      const result = await chrome.storage.local.get("currentTimezone")
      const currentTimezone = result.currentTimezone as TimezoneInfo
      if (currentTimezone?.id) {
        // 向標籤頁發送時區設置
        chrome.tabs.sendMessage(tabId, {
          type: "SET_TIMEZONE",
          timezone: currentTimezone.id
        })
      }
    } catch (error) {
      console.error("Failed to restore timezone:", error)
    }
  }
})

// 處理來自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_CURRENT_TAB") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      sendResponse(tab)
    })
    return true
  }
})
