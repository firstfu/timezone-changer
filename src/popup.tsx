import { StarIcon as StarIconSolid } from "@heroicons/react/20/solid"
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline"
import { memo, useCallback, useEffect, useMemo } from "react"

import "./styles/globals.css"

import TimezoneSelector from "~components/TimezoneSelector"
import { useTimezone } from "~hooks/useTimezone"
import type { TimezoneInfo } from "~types"

// 預先計算系統時區
const systemTimezone: TimezoneInfo = {
  id: Intl.DateTimeFormat().resolvedOptions().timeZone,
  name: Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "),
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

// 使用 memo 優化子組件
const TimezoneItem = memo(
  ({
    timezone,
    isFavorite,
    onSelect,
    onToggleFavorite
  }: {
    timezone: TimezoneInfo
    isFavorite: boolean
    onSelect: (timezone: TimezoneInfo) => void
    onToggleFavorite: (e: React.MouseEvent, timezone: TimezoneInfo) => void
  }) => (
    <div
      className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
      onClick={() => onSelect(timezone)}>
      <div>
        <p className="font-medium">{timezone.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {timezone.offset} ({timezone.abbr})
        </p>
      </div>
      <button
        onClick={(e) => onToggleFavorite(e, timezone)}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
        {isFavorite ? (
          <StarIconSolid className="h-5 w-5 text-yellow-500" />
        ) : (
          <StarIconOutline className="h-5 w-5" />
        )}
      </button>
    </div>
  )
)

TimezoneItem.displayName = "TimezoneItem"

function IndexPopup() {
  const {
    currentTimezone,
    recentTimezones,
    favoriteTimezones,
    setTimezone,
    toggleFavorite
  } = useTimezone()

  useEffect(() => {
    // 設置當前系統時區作為默認值
    if (!currentTimezone) {
      setTimezone(systemTimezone)
    }
  }, [currentTimezone, setTimezone])

  // 使用 useCallback 優化事件處理函數
  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, timezone: TimezoneInfo) => {
      e.stopPropagation()
      toggleFavorite(timezone)
    },
    [toggleFavorite]
  )

  const isFavorite = useCallback(
    (timezone: TimezoneInfo) =>
      favoriteTimezones.some((tz) => tz.id === timezone.id),
    [favoriteTimezones]
  )

  return (
    <div className="w-[400px] p-4 bg-white dark:bg-gray-900">
      <h1 className="text-xl font-bold mb-4">時區切換器</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">選擇時區</label>
          <TimezoneSelector selected={currentTimezone} onChange={setTimezone} />
        </div>

        {currentTimezone && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <TimezoneItem
              timezone={currentTimezone}
              isFavorite={isFavorite(currentTimezone)}
              onSelect={setTimezone}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}

        {favoriteTimezones.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-2">收藏的時區</h2>
            <div className="space-y-2">
              {favoriteTimezones.map((timezone) => (
                <TimezoneItem
                  key={timezone.id}
                  timezone={timezone}
                  isFavorite={true}
                  onSelect={setTimezone}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {recentTimezones.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-2">最近使用</h2>
            <div className="space-y-2">
              {recentTimezones.map((timezone) => (
                <TimezoneItem
                  key={timezone.id}
                  timezone={timezone}
                  isFavorite={isFavorite(timezone)}
                  onSelect={setTimezone}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
