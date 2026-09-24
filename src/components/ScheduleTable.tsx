import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ScheduleData } from '../types'
import { getDaysInMonth, getDayOfWeek, isWeekend, getDayName, getMonthName } from '../utils/helpers'
import { SidePanel } from './SidePanel'

interface Props {
  data: ScheduleData
  onChange: (data: ScheduleData) => void
  selectionMode?: boolean
  selStart?: { row: number; col: number } | null
  selEnd?: { row: number; col: number } | null
  onSelectionChange?: (start: { row: number; col: number }, end: { row: number; col: number }) => void
}

export const ScheduleTable: React.FC<Props> = ({
  data,
  onChange,
  selectionMode = false,
  selStart = null,
  selEnd = null,
  onSelectionChange,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ empId: string; day: number } | null>(null)
  const [selDragStart, setSelDragStart] = useState<{ row: number; col: number } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dragOverAfter, setDragOverAfter] = useState(false)
  const [isStickyShrunk, setIsStickyShrunk] = useState(false)
  const [stickyOffset, setStickyOffset] = useState(0)
  const tableRef = useRef<HTMLDivElement>(null)
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const switchesRef = useRef<HTMLDivElement>(null)

  const [year, month] = data.month.split('-').map(Number)
  const daysInMonth = getDaysInMonth(year, month)

  const handleCellClick = (empId: string, day: number) => {
    if (selectionMode) return
    if (selectedCell?.empId === empId && selectedCell?.day === day) {
      setSelectedCell(null)
    } else {
      setSelectedCell({ empId, day })
    }
  }

  const handleValueSelect = (code: string) => {
    if (!selectedCell) return
    applyValue(selectedCell.empId, selectedCell.day, code)
  }

  const applyValue = (empId: string, day: number, code: string) => {
    const dateKey = `${data.month}-${String(day).padStart(2, '0')}`
    const newSchedule = { ...data.schedule }
    if (!newSchedule[empId]) {
      newSchedule[empId] = {}
    }
    newSchedule[empId] = { ...newSchedule[empId], [dateKey]: code }
    onChange({ ...data, schedule: newSchedule })
  }

  const handleClearCell = () => {
    if (!selectedCell) return
    const { empId, day } = selectedCell
    const dateKey = `${data.month}-${String(day).padStart(2, '0')}`
    const newSchedule = { ...data.schedule }
    if (newSchedule[empId]) {
      newSchedule[empId] = { ...newSchedule[empId] }
      delete newSchedule[empId][dateKey]
    }
    onChange({ ...data, schedule: newSchedule })
  }

  const handleApplyTemplate = (templateId: string, empId: string, startDay: number, untilEnd: boolean) => {
    const tpl = data.templates.find(t => t.id === templateId)
    if (!tpl) return

    const newSchedule = { ...data.schedule }
    if (!newSchedule[empId]) newSchedule[empId] = {}
    newSchedule[empId] = { ...newSchedule[empId] }

    if (untilEnd) {
      for (let day = startDay; day <= daysInMonth; day++) {
        const dateKey = `${data.month}-${String(day).padStart(2, '0')}`
        const patternIndex = (day - startDay) % tpl.pattern.length
        newSchedule[empId][dateKey] = tpl.pattern[patternIndex]
      }
    } else {
      for (let i = 0; i < tpl.pattern.length && (startDay + i) <= daysInMonth; i++) {
        const day = startDay + i
        const dateKey = `${data.month}-${String(day).padStart(2, '0')}`
        newSchedule[empId][dateKey] = tpl.pattern[i]
      }
    }

    onChange({ ...data, schedule: newSchedule })
  }

  const getCellValue = (empId: string, day: number): string => {
    const dateKey = `${data.month}-${String(day).padStart(2, '0')}`
    return data.schedule[empId]?.[dateKey] || ''
  }

  const getLegendColor = (code: string): string => {
    const item = data.legend.find(l => l.code === code)
    return item?.color || '#ffffff'
  }

  const isInRange = (day: number, colIdx: number): boolean => {
    if (!selStart || !selEnd) return false
    const r1 = Math.min(selStart.row, selEnd.row)
    const r2 = Math.max(selStart.row, selEnd.row)
    const c1 = Math.min(selStart.col, selEnd.col)
    const c2 = Math.max(selStart.col, selEnd.col)
    return day >= r1 && day <= r2 && colIdx >= c1 && colIdx <= c2
  }

  const handleSelectionMouseDown = (day: number, colIdx: number) => {
    setSelDragStart({ row: day, col: colIdx })
    onSelectionChange?.({ row: day, col: colIdx }, { row: day, col: colIdx })
  }

  const handleSelectionMouseEnter = (day: number, colIdx: number) => {
    if (selDragStart) {
      onSelectionChange?.(selDragStart, { row: day, col: colIdx })
    }
  }

  const handleSelectionMouseUp = useCallback(() => {
    setSelDragStart(null)
  }, [])

  // --- Drag & Drop заголовков столбцов ---
  const pinColumn = data.dragPinColumn ?? true
  const swapMode = data.dragSwapMode ?? false

  const handleDragStart = (e: React.DragEvent, empId: string) => {
    setDraggingId(empId)
    e.dataTransfer.effectAllowed = 'move'
    // Скрываем дефолтный «призрак» браузера, чтобы не мешал
    e.dataTransfer.setData('text/plain', empId)
  }

  const handleDragOver = (e: React.DragEvent, empId: string) => {
    e.preventDefault()
    if (empId === draggingId) {
      setDragOverId(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const after = e.clientX > rect.left + rect.width / 2
    setDragOverId(empId)
    setDragOverAfter(after)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const fromIndex = data.employees.findIndex(emp => emp.id === draggingId)
    const toIndex = data.employees.findIndex(emp => emp.id === targetId)
    if (fromIndex === -1 || toIndex === -1) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    let newEmployees = [...data.employees]

    if (swapMode) {
      const temp = newEmployees[fromIndex]
      newEmployees[fromIndex] = newEmployees[toIndex]
      newEmployees[toIndex] = temp
    } else {
      const [moved] = newEmployees.splice(fromIndex, 1)
      const newTargetIndex = newEmployees.findIndex(emp => emp.id === targetId)
      const insertIndex = dragOverAfter ? newTargetIndex + 1 : newTargetIndex
      newEmployees.splice(insertIndex, 0, moved)
    }

    let newSchedule = data.schedule
    if (!pinColumn) {
      // Данные остаются на прежних позициях столбцов
      const oldIds = data.employees.map(emp => emp.id)
      const positionData = oldIds.map(id => data.schedule[id] || {})
      newSchedule = {}
      newEmployees.forEach((emp, idx) => {
        newSchedule[emp.id] = positionData[idx] || {}
      })
    }

    onChange({ ...data, employees: newEmployees, schedule: newSchedule })
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  const setPinColumn = (value: boolean) => {
    onChange({ ...data, dragPinColumn: value })
  }

  const setSwapMode = (value: boolean) => {
    onChange({ ...data, dragSwapMode: value })
  }

  // --- Сворачивание заголовков при скролле ---
  useEffect(() => {
    const measure = () => {
      if (switchesRef.current) {
        setStickyOffset(switchesRef.current.getBoundingClientRect().height)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!theadRef.current) return
      const rect = theadRef.current.getBoundingClientRect()
      setIsStickyShrunk(rect.top <= stickyOffset + 4)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [stickyOffset])

  return (
    <div className="flex" onMouseUp={handleSelectionMouseUp}>
      <div className="flex-1 min-w-0">
        {/* Навигация по месяцам */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              const prevMonth = month === 1 ? 12 : month - 1
              const prevYear = month === 1 ? year - 1 : year
              onChange({ ...data, month: `${prevYear}-${String(prevMonth).padStart(2, '0')}` })
            }}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            ← Пред.
          </button>
          <span className="text-lg font-semibold dark:text-gray-100">
            {getMonthName(month)} {year}
          </span>
          <button
            onClick={() => {
              const nextMonth = month === 12 ? 1 : month + 1
              const nextYear = month === 12 ? year + 1 : year
              onChange({ ...data, month: `${nextYear}-${String(nextMonth).padStart(2, '0')}` })
            }}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            След. →
          </button>
        </div>

        {/* Переключатели режимов перетаскивания */}
        <div ref={switchesRef} className="flex flex-wrap items-center gap-6 pb-2 sticky top-0 z-40 bg-gray-50 dark:bg-gray-900">
          <label className="flex items-center gap-2 cursor-pointer select-none" title="При перемещении сотрудника перемещается и его столбец смен">
            <button
              type="button"
              onClick={() => setPinColumn(!pinColumn)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                pinColumn ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  pinColumn ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Закрепить столбец</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none" title="Вкл — обмен местами с целевым сотрудником; Выкл — вставка между сотрудниками">
            <button
              type="button"
              onClick={() => setSwapMode(!swapMode)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                swapMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  swapMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Обмен местами</span>
          </label>
        </div>

        {/* Таблица */}
        <div className="overflow-visible" ref={tableRef} id="schedule-table-export">
          <table className="border-collapse border border-gray-300 dark:border-gray-600">
            <thead ref={theadRef}>
              <tr className={`sticky z-30 transition-shadow duration-200 ${isStickyShrunk ? 'shadow-md' : ''}`} style={{ top: stickyOffset }}>
                <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 sticky left-0 z-30 w-12 text-xs">
                  День
                </th>
                {data.employees.map(emp => {
                  const isDragging = draggingId === emp.id
                  const isDragOver = dragOverId === emp.id
                  return (
                    <th
                      key={emp.id}
                      draggable
                      onDragStart={e => handleDragStart(e, emp.id)}
                      onDragOver={e => handleDragOver(e, emp.id)}
                      onDrop={e => handleDrop(e, emp.id)}
                      onDragEnd={handleDragEnd}
                      className={`border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 relative select-none transition-all duration-200 ${
                        isDragging ? 'opacity-50' : ''
                      } ${isDragOver && swapMode ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    >
                      {!isStickyShrunk && (
                        <span
                          className="select-none pointer-events-none"
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            fontSize: 10,
                            color: '#9ca3af',
                            letterSpacing: '-1px',
                            lineHeight: 1,
                          }}
                        >
                          ⋮⋮
                        </span>
                      )}
                      {isStickyShrunk ? (
                        <div
                          style={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            padding: '4px 2px 0px 2px',
                            minHeight: '50px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            fontSize: '13px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {emp.name.slice(0, 4)}
                        </div>
                      ) : data.verticalNames ? (
                        <div
                          style={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            padding: '10px 2px 4px 2px',
                            minHeight: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            fontSize: '13px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {emp.name}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '4px 8px',
                            paddingRight: '18px',
                            fontSize: '13px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {emp.name}
                        </div>
                      )}
                      {isDragOver && !swapMode && (
                        <div
                          className={`absolute top-0 bottom-0 w-0.5 bg-blue-500 ${
                            dragOverAfter ? 'right-0' : 'left-0'
                          }`}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dow = getDayOfWeek(year, month, day)
                const weekend = isWeekend(year, month, day)

                return (
                  <tr key={day} className={weekend ? 'bg-gray-100 dark:bg-gray-800' : ''}>
                    <td className={`border border-gray-300 dark:border-gray-600 sticky left-0 z-10 ${weekend ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} dark:text-gray-100`} style={{ padding: '4px 8px', verticalAlign: 'bottom' }}>
                      <div className="font-medium dark:text-gray-100">{day}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{getDayName(dow)}</div>
                    </td>
                    {data.employees.map((emp, colIdx) => {
                      const value = getCellValue(emp.id, day)
                      const isSelected = !selectionMode && selectedCell?.empId === emp.id && selectedCell?.day === day
                      const inRange = selectionMode && isInRange(day, colIdx)

                      return (
                        <td
                          key={emp.id}
                          className={`border border-gray-300 dark:border-gray-600 px-1 py-1 text-center dark:text-gray-100 ${
                            selectionMode ? 'cursor-crosshair select-none' : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30'
                          } ${isSelected ? 'ring-2 ring-blue-500' : ''} ${inRange ? 'bg-blue-200/60 dark:bg-blue-800/60' : ''}`}
                          onClick={() => handleCellClick(emp.id, day)}
                          onMouseDown={selectionMode ? () => handleSelectionMouseDown(day, colIdx) : undefined}
                          onMouseEnter={selectionMode ? () => handleSelectionMouseEnter(day, colIdx) : undefined}
                        >
                          {value ? (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: getLegendColor(value), color: '#1f2937' }}
                            >
                              {value}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Боковая панель */}
      {selectedCell && (
        <SidePanel
          data={data}
          selectedCell={selectedCell}
          onValueSelect={handleValueSelect}
          onApplyTemplate={handleApplyTemplate}
          onClearCell={handleClearCell}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  )
}
