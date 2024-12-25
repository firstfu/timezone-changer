import { Combobox, Transition } from "@headlessui/react"
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid"
import { Fragment, useEffect, useMemo, useState } from "react"

import type { TimezoneInfo } from "~types"

interface TimezoneSelectorProps {
  selected: TimezoneInfo | null
  onChange: (timezone: TimezoneInfo) => void
}

export default function TimezoneSelector({
  selected,
  onChange
}: TimezoneSelectorProps) {
  const [query, setQuery] = useState("")
  const [timezones, setTimezones] = useState<TimezoneInfo[]>([])

  useEffect(() => {
    // 初始化時區列表
    const now = new Date()
    const allTimezones = Intl.supportedValuesOf("timeZone").map((tz) => ({
      id: tz,
      name: tz.replace(/_/g, " "),
      offset:
        now
          .toLocaleString("en-US", { timeZone: tz, timeZoneName: "longOffset" })
          .split(" ")
          .pop() || "",
      abbr:
        now
          .toLocaleString("en-US", { timeZone: tz, timeZoneName: "short" })
          .split(" ")
          .pop() || "",
      isDST: false,
      isSystem: false
    }))
    setTimezones(allTimezones)
  }, [])

  // 使用 useMemo 緩存過濾後的時區列表
  const filteredTimezones = useMemo(() => {
    if (query === "") return timezones
    const searchStr = query.toLowerCase()
    return timezones.filter((timezone) => {
      return timezone.name.toLowerCase().includes(searchStr)
    })
  }, [query, timezones])

  return (
    <Combobox value={selected} onChange={onChange}>
      <div className="relative mt-1">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
          <Combobox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0"
            displayValue={(timezone: TimezoneInfo) => timezone?.name || ""}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋時區..."
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}>
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
            {filteredTimezones.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                找不到時區。
              </div>
            ) : (
              filteredTimezones.map((timezone) => (
                <Combobox.Option
                  key={timezone.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-gray-900 dark:text-white"
                    }`
                  }
                  value={timezone}>
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}>
                        {timezone.name} ({timezone.offset})
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-white" : "text-blue-600"
                          }`}>
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  )
}
