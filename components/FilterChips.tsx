'use client'

import { useFilterStore } from '@/lib/store'
import type { EventCategory } from '@/lib/types'

const CHIPS: Array<{ label: string; category?: EventCategory; freeOnly?: boolean; all?: boolean }> = [
  { label: 'All', all: true },
  { label: 'Career', category: 'career' },
  { label: 'Hackathons', category: 'hackathon' },
  { label: 'Workshops', category: 'workshop' },
  { label: 'Social', category: 'social' },
  { label: 'Arts', category: 'arts' },
  { label: 'Open Houses', category: 'open_house' },
  { label: 'Free only', freeOnly: true },
]

export default function FilterChips() {
  const { categories, isFree, setFilter } = useFilterStore()
  const sportsActive = categories.includes('sports')

  function toggleCategory(cat: EventCategory) {
    setFilter({
      categories: categories.includes(cat)
        ? categories.filter((c) => c !== cat)
        : [...categories, cat],
    })
  }

  function clearAll() {
    setFilter({ categories: [], isFree: null })
  }

  return (
    <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto px-4 py-3 scrollbar-none">
      <button
        onClick={() => toggleCategory('sports')}
        className={`flex-none rounded-full border-[0.5px] px-3 py-1.5 text-[11px] font-medium transition-colors ${
          sportsActive
            ? 'border-[#3b6d11] bg-[#E3EAD9] text-[#3b6d11]'
            : 'border-[#3b6d11] bg-transparent text-[#3b6d11]'
        }`}
      >
        Sports
      </button>

      {CHIPS.map((chip) => {
        const active = chip.all
          ? categories.length === 0 && isFree === null
          : chip.freeOnly
            ? isFree === true
            : Boolean(chip.category && categories.includes(chip.category))

        return (
          <button
            key={chip.label}
            onClick={() => {
              if (chip.all) clearAll()
              else if (chip.freeOnly) setFilter({ isFree: isFree === true ? null : true })
              else if (chip.category) toggleCategory(chip.category)
            }}
            className={`flex-none rounded-full border-[0.5px] px-3 py-1.5 text-[11px] transition-colors ${
              active
                ? 'border-text-primary bg-text-primary text-bg-base'
                : 'border-border bg-transparent text-text-secondary hover:border-hover hover:text-text-primary'
            }`}
          >
            {chip.label}
          </button>
        )
      })}
    </div>
  )
}
