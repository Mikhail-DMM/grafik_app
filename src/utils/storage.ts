import { AppData, ScheduleData } from '../types'
import { generateId } from './helpers'

const STORAGE_KEY = 'grafik-app-data'

export const createDefaultSchedule = (name?: string): ScheduleData => {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return {
    id: generateId(),
    name: name || 'График',
    month,
    employees: [
      { id: 'emp-1', name: 'Иванов И.И.' },
      { id: 'emp-2', name: 'Петров П.П.' },
      { id: 'emp-3', name: 'Сидоров С.С.' },
    ],
    legend: [
      { code: 'Д', label: 'Дневная смена', color: '#4ade80' },
      { code: 'Н', label: 'Ночная смена', color: '#60a5fa' },
      { code: 'В', label: 'Выходной', color: '#d1d5db' },
      { code: 'О', label: 'Отпуск', color: '#facc15' },
      { code: 'Б', label: 'Больничный', color: '#f87171' },
    ],
    templates: [
      {
        id: 'tpl-1',
        name: 'Два через два',
        pattern: ['Д', 'Д', 'Н', 'Н', 'В', 'В'],
      },
    ],
    schedule: {},
    verticalNames: true,
    dragPinColumn: true,
    dragSwapMode: false,
  }
}

export const getDefaultAppData = (): AppData => {
  const schedule = createDefaultSchedule('График')
  return {
    schedules: [schedule],
    activeScheduleId: schedule.id,
  }
}

export const loadData = (): AppData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Миграция со старого формата (ScheduleData → AppData)
      if (Array.isArray(parsed.schedules)) {
        // Миграция: добавить поля если отсутствуют
        parsed.schedules = parsed.schedules.map((s: Record<string, unknown>) => ({
          ...s,
          verticalNames: s.verticalNames ?? true,
          dragPinColumn: s.dragPinColumn ?? true,
          dragSwapMode: s.dragSwapMode ?? false,
        }))
        return parsed
      }
      // Старый формат — один ScheduleData
      if (parsed.month && parsed.employees) {
        const migrated: AppData = {
          schedules: [{ ...parsed, id: parsed.id || generateId(), name: parsed.name || 'График', verticalNames: parsed.verticalNames ?? true, dragPinColumn: parsed.dragPinColumn ?? true, dragSwapMode: parsed.dragSwapMode ?? false }],
          activeScheduleId: parsed.id || generateId(),
        }
        migrated.schedules[0].id = migrated.activeScheduleId
        return migrated
      }
    }
  } catch (e) {
    console.error('Failed to load data from localStorage', e)
  }
  return getDefaultAppData()
}

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save data to localStorage', e)
  }
}

export const getActiveSchedule = (data: AppData): ScheduleData => {
  return data.schedules.find(s => s.id === data.activeScheduleId) || data.schedules[0]
}

export const exportToJson = (data: AppData): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `grafik-app-data.json`
  a.click()
  URL.revokeObjectURL(url)
}

export const importFromJson = (file: File): Promise<AppData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        // Миграция если нужно
        if (Array.isArray(parsed.schedules)) {
          parsed.schedules = parsed.schedules.map((s: Record<string, unknown>) => ({
            ...s,
            verticalNames: s.verticalNames ?? true,
            dragPinColumn: s.dragPinColumn ?? true,
            dragSwapMode: s.dragSwapMode ?? false,
          }))
          resolve(parsed)
        } else if (parsed.month && parsed.employees) {
          const id = generateId()
          const schedule = { ...parsed, id, name: parsed.name || 'График', verticalNames: parsed.verticalNames ?? true, dragPinColumn: parsed.dragPinColumn ?? true, dragSwapMode: parsed.dragSwapMode ?? false }
          resolve({
            schedules: [schedule],
            activeScheduleId: id,
          })
        } else {
          reject(new Error('Invalid format'))
        }
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
