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

        // 更新緩存和���態
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
        console.error("Failed to load timezones:", error)
      }
    }

    loadTimezones()
  }, [])

  // 使用 useCallback 優化函數
  const setTimezone = useCallback(
    async (timezone: TimezoneInfo) => {
      try {
        await storage.set("currentTimezone", timezone)
        setCurrentTimezone(timezone)
        timezoneCache.current = timezone

        // 更新最近使用的時區
        const updatedRecent = [
          timezone,
          ...recentTimezones.filter((tz) => tz.id !== timezone.id)
        ].slice(0, 10)

        await storage.set("recentTimezones", updatedRecent)
        setRecentTimezones(updatedRecent)
        timezoneCache.recent = updatedRecent

        // 更新當前標籤頁的時區
        chrome.runtime.sendMessage({ type: "GET_CURRENT_TAB" }, (tab) => {
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "SET_TIMEZONE",
              timezone: timezone.id
            })
          }
        })
      } catch (error) {
        console.error("Failed to set timezone:", error)
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
