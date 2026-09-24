export interface Employee {
  id: string
  name: string
}

export interface LegendItem {
  code: string
  label: string
  color: string
}

export interface Template {
  id: string
  name: string
  pattern: string[]
}

export interface ScheduleData {
  id: string
  name: string
  month: string // "2026-09"
  employees: Employee[]
  legend: LegendItem[]
  templates: Template[]
  schedule: Record<string, Record<string, string>> // employeeId -> { "2026-09-01": "Д" }
  verticalNames: boolean
  dragPinColumn: boolean // true — при перетаскивании сотрудника перемещается и его столбец данных
  dragSwapMode: boolean // true — обмен местами, false — вставка между сотрудниками
}

export interface AppData {
  schedules: ScheduleData[]
  activeScheduleId: string
}

export type TabType = 'schedule' | 'settings' | 'statistics'
