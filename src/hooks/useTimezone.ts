import { useCallback, useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import type { TimezoneInfo } from "~types"

const storage = new Storage({
  area: "local"
})

// 創建一個緩存對象來存儲時區數據
const timezoneCache = {
  current: null as TimezoneInfo | null,
  recent: [] as TimezoneInfo[],
  favorites: [] as TimezoneInfo[]
}

export function useTimezone() {
  const [currentTimezone, setCurrentTimezone] = useState<TimezoneInfo | null>(
    timezoneCache.current
  )
  const [recentTimezones, setRecentTimezones] = useState<TimezoneInfo[]>(
    timezoneCache.recent
  )
  const [favoriteTimezones, setFavoriteTimezones] = useState<TimezoneInfo[]>(
    timezoneCache.favorites
  )

  // 使用 useEffect 加載時區數據
  useEffect(() => {
    const loadTimezones = async () => {
      try {
        const [current, recent, favorites] = await Promise.all([
          storage.get<TimezoneInfo>("currentTimezone"),
          storage.get<TimezoneInfo[]>("recentTimezones"),
          storage.get<TimezoneInfo[]>("favoriteTimezones")
        ])

        // 更新緩存和狀態
        if (current) {
          timezoneCache.current = current
          setCurrentTimezone(current)
        }

        if (recent) {
          timezoneCache.recent = recent
          setRecentTimezones(recent)
        }

        if (favorites) {
          timezoneCache.favorites = favorites
          setFavoriteTimezones(favorites)
        }
      } catch (error) {
        console.error("載入時區失敗:", error)
      }
    }

    loadTimezones()
  }, [])

  // 使用 useCallback 優化函數
  const setTimezone = useCallback(
    async (timezone: TimezoneInfo) => {
      try {
        // 先更新 storage
        await storage.set("currentTimezone", timezone)

        // 更新緩存
        timezoneCache.current = timezone

        // 更新狀態
        setCurrentTimezone(timezone)

        // 更新最近使用的時區
        const updatedRecent = [
          timezone,
          ...recentTimezones.filter((tz) => tz.id !== timezone.id)
        ].slice(0, 10)

        // 保存最近使用的時區
        await storage.set("recentTimezones", updatedRecent)
        timezoneCache.recent = updatedRecent
        setRecentTimezones(updatedRecent)

        // 更新當前標籤頁的時區
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true
        })
        const currentTab = tabs[0]
        if (currentTab?.id) {
          await chrome.tabs.sendMessage(currentTab.id, {
            type: "SET_TIMEZONE",
            timezone: timezone.id
          })
        }
      } catch (error) {
        console.error("設置時區失敗:", error)
      }
    },
    [recentTimezones]
  )

  const toggleFavorite = useCallback(
    async (timezone: TimezoneInfo) => {
      try {
        const isFavorite = favoriteTimezones.some((tz) => tz.id === timezone.id)
        let updatedFavorites: TimezoneInfo[]

        if (isFavorite) {
          updatedFavorites = favoriteTimezones.filter(
            (tz) => tz.id !== timezone.id
          )
        } else {
          if (favoriteTimezones.length >= 10) {
            updatedFavorites = [...favoriteTimezones.slice(1), timezone]
          } else {
            updatedFavorites = [...favoriteTimezones, timezone]
          }
        }

        await storage.set("favoriteTimezones", updatedFavorites)
        setFavoriteTimezones(updatedFavorites)
        timezoneCache.favorites = updatedFavorites
      } catch (error) {
        console.error("Failed to toggle favorite:", error)
      }
    },
    [favoriteTimezones]
  )

  return {
    currentTimezone,
    recentTimezones,
    favoriteTimezones,
    setTimezone,
    toggleFavorite
  }
}
