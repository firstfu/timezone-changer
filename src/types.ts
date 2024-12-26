export interface TimezoneInfo {
  id: string
  name: string
  offset: string
  abbr: string
  isDST: boolean
  isSystem: boolean
}

export interface StoredTimezone {
  id: string
  timestamp: number
}
