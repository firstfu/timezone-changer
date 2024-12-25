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

    console.log(timezones)

    await storage.set("allTimezones", timezones)
  } catch (error) {
    console.error("Failed to preload timezones:", error)
  }
}

// 在擴展啟動時預加載數據
chrome.runtime.onInstalled.addListener(() => {
  preloadTimezones()
})

// 在擴展啟動時預加載數據
chrome.runtime.onStartup.addListener(() => {
  preloadTimezones()
})
