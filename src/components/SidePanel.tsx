import React from 'react'
import { ScheduleData, LegendItem, Template } from '../types'
import { getDayName, getDayOfWeek } from '../utils/helpers'

interface Props {
  data: ScheduleData
  selectedCell: { empId: string; day: number }
  onValueSelect: (code: string) => void
  onApplyTemplate: (templateId: string, empId: string, startDay: number, untilEnd: boolean) => void
  onClearCell: () => void
  onClose: () => void
}

export const SidePanel: React.FC<Props> = ({
  data,
  selectedCell,
  onValueSelect,
  onApplyTemplate,
  onClearCell,
  onClose,
}) => {
  const employee = data.employees.find(e => e.id === selectedCell.empId)
  const [year, month] = data.month.split('-').map(Number)
  const dow = getDayOfWeek(year, month, selectedCell.day)
  const dayName = getDayName(dow)

  return (
    <div
      className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600 shadow-xl z-50 flex flex-col overflow-y-auto"
    >
      {/* Шапка панели */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
        <div>
          <div className="font-semibold text-gray-800 dark:text-gray-100">{employee?.name || '—'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedCell.day} {getMonthNameShort(month)} ({dayName})
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
        >
          ✕
        </button>
      </div>

      {/* Обозначения */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <div className="text-xs font-medium text-gray-400 uppercase mb-2">Обозначения</div>
        <div className="grid grid-cols-3 gap-2">
          {data.legend.map(item => (
            <button
              key={item.code}
              onClick={() => onValueSelect(item.code)}
              className="flex flex-col items-center gap-1 px-2 py-2 rounded border border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 transition-colors dark:bg-gray-700"
              title={item.label}
            >
              <span
                className="w-8 h-8 flex items-center justify-center rounded font-bold text-sm"
                style={{ backgroundColor: item.color, color: '#1f2937' }}
              >
                {item.code}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight text-center">{item.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClearCell}
          className="w-full mt-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          Очистить ячейку
        </button>
      </div>

      {/* Паттерны */}
      <div className="px-4 py-3">
        <div className="text-xs font-medium text-gray-400 uppercase mb-2">Шаблоны</div>
        {data.templates.length === 0 ? (
          <div className="text-sm text-gray-400">Нет шаблонов. Создайте во вкладке «Настройки»</div>
        ) : (
          <div className="space-y-3">
            {data.templates.map(tpl => (
              <div key={tpl.id} className="border border-gray-200 dark:border-gray-600 rounded p-3 dark:bg-gray-700">
                <div className="font-medium text-sm mb-1 dark:text-gray-100">{tpl.name}</div>
                <div className="text-xs text-gray-400 mb-2">
                  {tpl.pattern.join(' → ')}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApplyTemplate(tpl.id, selectedCell.empId, selectedCell.day, false)}
                    className="flex-1 px-2 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    1 раз
                  </button>
                  <button
                    onClick={() => onApplyTemplate(tpl.id, selectedCell.empId, selectedCell.day, true)}
                    className="flex-1 px-2 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    До конца
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getMonthNameShort(month: number): string {
  const names = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
  ]
  return names[month - 1]
}
