// 監聽來自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SET_TIMEZONE") {
    try {
      // 修改當前頁面的時區
      const script = document.createElement("script")
      script.textContent = `
        try {
          // 保存原始的 Date 對象
          const OriginalDate = Date

          // 創建新的 Date 對象
          function CustomDate(...args) {
            if (args.length === 0) {
              const date = new OriginalDate()
              return new OriginalDate(date.toLocaleString("en-US", { timeZone: "${request.timezone}" }))
            }
            return new OriginalDate(...args)
          }

          // 複製原始 Date 對象的屬性
          Object.setPrototypeOf(CustomDate, OriginalDate)
          CustomDate.prototype = OriginalDate.prototype

          // 替換全局的 Date 對象
          Date = CustomDate

          console.log("Timezone changed to: ${request.timezone}")
        } catch (error) {
          console.error("Failed to set timezone:", error)
        }
      `
      document.documentElement.appendChild(script)
      script.remove()
      sendResponse({ success: true })
    } catch (error) {
      console.error("Failed to inject script:", error)
      sendResponse({ success: false, error })
    }
  }
  return true
})
