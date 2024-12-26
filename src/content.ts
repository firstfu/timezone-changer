import type { StoredTimezone } from "~types"

// 注入時區設置腳本
function injectTimezoneScript(timezone: string) {
  const code = `
    try {
      const OriginalDate = Date;

      function CustomDate(...args) {
        if (args.length === 0) {
          const date = new OriginalDate();
          return new OriginalDate(date.toLocaleString("en-US", { timeZone: "${timezone}" }));
        }
        return new OriginalDate(...args);
      }

      Object.setPrototypeOf(CustomDate, OriginalDate);
      CustomDate.prototype = OriginalDate.prototype;
      Date = CustomDate;
    } catch (error) {
      console.error("設置時區失敗:", error);
    }
  `

  try {
    chrome.scripting.executeScript({
      target: { tabId: chrome.tabs.TAB_ID_NONE },
      func: (scriptCode) => {
        const script = document.createElement("script")
        script.textContent = scriptCode
        ;(document.head || document.documentElement).appendChild(script)
        script.remove()
      },
      args: [code]
    })
  } catch (error) {
    console.error("注入腳本失敗:", error)
    throw error
  }
}

// 在頁面載入時恢復時區設置
async function restoreTimezone() {
  try {
    const result = await chrome.storage.local.get("currentTimezone")
    const currentTimezone = result.currentTimezone as StoredTimezone
    if (currentTimezone?.id) {
      injectTimezoneScript(currentTimezone.id)
    }
  } catch (error) {
    console.error("恢復時區失敗:", error)
  }
}

// 監聽來自 background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SET_TIMEZONE") {
    try {
      injectTimezoneScript(request.timezone)
      sendResponse({ success: true })
    } catch (error) {
      sendResponse({ success: false, error: error.message })
    }
  }
  return true
})

// 在頁面載入時恢復時區
document.addEventListener("DOMContentLoaded", restoreTimezone)

// 立即嘗試恢復時區
restoreTimezone()
