import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AppData, ScheduleData, TabType } from './types'
import { loadData, saveData, exportToJson, importFromJson, createDefaultSchedule } from './utils/storage'
import { exportToExcel } from './utils/excel'
import { getMonthName } from './utils/helpers'
import { ScheduleTable } from './components/ScheduleTable'
import { Settings } from './components/Settings'
import { Statistics } from './components/Statistics'
import html2canvas from 'html2canvas'
import { useTheme } from './hooks/useTheme'

const App: React.FC = () => {
  const { theme, toggle } = useTheme()
  const [appData, setAppData] = useState<AppData>(loadData)
  const [activeTab, setActiveTab] = useState<TabType>('schedule')
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showTransferModal, setShowTransferModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  const activeSchedule = appData.schedules.find(s => s.id === appData.activeScheduleId) || appData.schedules[0]

  // Автосохранение
  useEffect(() => {
    saveData(appData)
  }, [appData])

  const updateSchedule = useCallback((updated: ScheduleData) => {
    setAppData(prev => ({
      ...prev,
      schedules: prev.schedules.map(s => s.id === updated.id ? updated : s),
    }))
  }, [])

  // --- Управление графиками ---
  const addSchedule = () => {
    const template = activeSchedule || appData.schedules[0]
    const newSchedule = createDefaultSchedule(`График ${appData.schedules.length + 1}`)
    // Копируем сотрудников, обозначения и шаблоны из шаблонного
    if (template) {
      newSchedule.employees = [...template.employees]
      newSchedule.legend = [...template.legend]
      newSchedule.templates = [...template.templates]
      newSchedule.verticalNames = template.verticalNames
    }
    setAppData(prev => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule],
      activeScheduleId: newSchedule.id,
    }))
  }

  const addScheduleCurrentMonth = () => {
    const template = activeSchedule || appData.schedules[0]
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
    const newSchedule = createDefaultSchedule(`${monthNames[now.getMonth()]} ${now.getFullYear()}`)
    newSchedule.month = month
    if (template) {
      newSchedule.employees = [...template.employees]
      newSchedule.legend = [...template.legend]
      newSchedule.templates = [...template.templates]
      newSchedule.verticalNames = template.verticalNames
    }
    setAppData(prev => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule],
      activeScheduleId: newSchedule.id,
    }))
  }

  const removeSchedule = (id: string) => {
    if (appData.schedules.length <= 1) return
    if (!confirm('Удалить этот график?')) return
    setAppData(prev => {
      const remaining = prev.schedules.filter(s => s.id !== id)
      return {
        ...prev,
        schedules: remaining,
        activeScheduleId: prev.activeScheduleId === id ? remaining[0].id : prev.activeScheduleId,
      }
    })
  }

  const startRenameSchedule = (id: string, currentName: string) => {
    setEditingNameId(id)
    setEditingName(currentName)
  }

  const finishRenameSchedule = () => {
    if (editingNameId && editingName.trim()) {
      setAppData(prev => ({
        ...prev,
        schedules: prev.schedules.map(s =>
          s.id === editingNameId ? { ...s, name: editingName.trim() } : s
        ),
      }))
    }
    setEditingNameId(null)
    setEditingName('')
  }

  // --- Перенос данных ---
  const transferData = (sourceId: string) => {
    const source = appData.schedules.find(s => s.id === sourceId)
    if (!source || !activeSchedule) return
    updateSchedule({
      ...activeSchedule,
      schedule: { ...source.schedule },
    })
    setShowTransferModal(false)
  }

  // --- Экспорт JPG ---
  const [showJpgModal, setShowJpgModal] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selStart, setSelStart] = useState<{ row: number; col: number } | null>(null)
  const [selEnd, setSelEnd] = useState<{ row: number; col: number } | null>(null)

  const buildExportTable = (rows?: { from: number; to: number }, cols?: { from: number; to: number }) => {
    if (!activeSchedule) return null
    const [year, month] = activeSchedule.month.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const startRow = rows?.from ?? 1
    const endRow = rows?.to ?? daysInMonth
    const startCol = cols?.from ?? 0
    const endCol = cols?.to ?? activeSchedule.employees.length - 1
    const employees = activeSchedule.employees.slice(startCol, endCol + 1)

    const table = document.createElement('table')
    table.style.borderCollapse = 'separate'
    table.style.borderSpacing = '0'
    table.style.border = '1px solid #999'
    table.style.fontSize = '12px'
    table.style.fontFamily = 'Arial, sans-serif'

    // thead
    const thead = document.createElement('thead')
    const headRow = document.createElement('tr')
    const thDay = document.createElement('th')
    thDay.textContent = 'День'
    thDay.style.border = '1px solid #999'
    thDay.style.padding = '4px 8px'
    thDay.style.background = '#e5e7eb'
    thDay.style.fontWeight = 'bold'
    thDay.style.textAlign = 'center'
    thDay.style.verticalAlign = 'bottom'
    headRow.appendChild(thDay)

    for (const emp of employees) {
      const th = document.createElement('th')
      th.style.border = '1px solid #999'
      th.style.background = '#e5e7eb'
      th.style.fontWeight = 'bold'
      if (activeSchedule.verticalNames) {
        const fontSize = 13
        const fontWeight = 'bold'
        const tmpC = document.createElement('canvas')
        const tmpCtx = tmpC.getContext('2d')!
        tmpCtx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`
        const textW = tmpCtx.measureText(emp.name).width
        const cw = fontSize + 4
        const ch = textW + 4
        tmpC.width = cw
        tmpC.height = ch
        tmpCtx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`
        tmpCtx.fillStyle = '#000'
        tmpCtx.textAlign = 'center'
        tmpCtx.textBaseline = 'middle'
        tmpCtx.translate(cw / 2, ch / 2)
        tmpCtx.rotate(-Math.PI / 2)
        tmpCtx.fillText(emp.name, 0, 0)

        th.style.width = cw + 'px'
        th.style.minWidth = cw + 'px'
        th.style.maxWidth = cw + 'px'
        th.style.height = ch + 'px'
        th.style.padding = '0'
        th.style.verticalAlign = 'bottom'
        th.style.textAlign = 'center'

        const img = document.createElement('img')
        img.src = tmpC.toDataURL('image/png')
        img.style.display = 'block'
        img.style.margin = '0 auto'
        img.style.verticalAlign = 'bottom'
        img.width = cw
        img.height = ch
        th.appendChild(img)
      } else {
        th.style.padding = '4px 8px'
        th.style.whiteSpace = 'nowrap'
        th.textContent = emp.name
      }
      headRow.appendChild(th)
    }
    thead.appendChild(headRow)
    table.appendChild(thead)

    // tbody
    const tbody = document.createElement('tbody')
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    for (let day = startRow; day <= endRow; day++) {
      const date = new Date(year, month - 1, day)
      const dow = date.getDay()
      const isWk = dow === 0 || dow === 6
      const tr = document.createElement('tr')
      tr.style.height = '28px'
      if (isWk) tr.style.background = '#e5e7eb'

      const tdDay = document.createElement('td')
      tdDay.textContent = `${day} ${dayNames[dow]}`
      tdDay.style.border = '1px solid #999'
      tdDay.style.padding = '0 8px'
      tdDay.style.fontWeight = 'bold'
      tdDay.style.whiteSpace = 'nowrap'
      tdDay.style.verticalAlign = 'middle'
      tdDay.style.lineHeight = '28px'
      tdDay.style.background = isWk ? '#e5e7eb' : '#ffffff'
      tr.appendChild(tdDay)

      for (const emp of employees) {
        const dateKey = `${activeSchedule.month}-${String(day).padStart(2, '0')}`
        const value = activeSchedule.schedule[emp.id]?.[dateKey] || ''
        const legendItem = activeSchedule.legend.find(l => l.code === value)
        const td = document.createElement('td')
        td.style.border = '1px solid #999'
        td.style.padding = '0'
        td.style.textAlign = 'center'
        td.style.verticalAlign = 'middle'
        td.style.minWidth = '36px'
        td.style.background = isWk ? '#e5e7eb' : '#ffffff'
        if (value) {
          const fontSize = 12
          const fontWeight = 'bold'
          const text = value.toUpperCase()
          const c = document.createElement('canvas')
          const ctx = c.getContext('2d')!
          ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`
          const tw = ctx.measureText(text).width
          const cw = Math.max(tw + 14, 28)
          const ch = fontSize + 10
          c.width = cw
          c.height = ch
          // background rounded rect
          if (legendItem) {
            ctx.fillStyle = legendItem.color
            const r = 4
            ctx.beginPath()
            ctx.moveTo(r, 0)
            ctx.lineTo(cw - r, 0)
            ctx.quadraticCurveTo(cw, 0, cw, r)
            ctx.lineTo(cw, ch - r)
            ctx.quadraticCurveTo(cw, ch, cw - r, ch)
            ctx.lineTo(r, ch)
            ctx.quadraticCurveTo(0, ch, 0, ch - r)
            ctx.lineTo(0, r)
            ctx.quadraticCurveTo(0, 0, r, 0)
            ctx.fill()
          }
          ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`
          ctx.fillStyle = '#000'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(text, cw / 2, ch / 2)
          const img = document.createElement('img')
          img.src = c.toDataURL('image/png')
          img.width = cw
          img.height = ch
          img.style.display = 'block'
          img.style.margin = 'auto'
          td.appendChild(img)
        }
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    return table
  }

  const exportJpg = async (mode: 'full' | 'selection') => {
    setShowJpgModal(false)
    const [year, month] = activeSchedule.month.split('-').map(Number)
    const headerText = `${getMonthName(month)} ${year}`

    if (mode === 'selection') {
      setSelectionMode(true)
      return
    }

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '-9999px'
    container.style.left = '0'
    container.style.background = 'white'
    container.style.padding = '20px'
    container.style.width = 'fit-content'

    const header = document.createElement('div')
    header.style.fontSize = '20px'
    header.style.fontWeight = 'bold'
    header.style.marginBottom = '12px'
    header.style.textAlign = 'center'
    header.style.fontFamily = 'Arial, sans-serif'
    header.textContent = headerText
    container.appendChild(header)

    const tableWrapper = document.createElement('div')
    tableWrapper.style.overflow = 'hidden'
    tableWrapper.style.display = 'inline-block'
    const table = buildExportTable()
    if (table) tableWrapper.appendChild(table)
    container.appendChild(tableWrapper)

    document.body.appendChild(container)
    try {
      const canvas = await html2canvas(container, { useCORS: true, scale: 2 })
      const link = document.createElement('a')
      link.download = `grafik-${activeSchedule.month}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
    } finally {
      document.body.removeChild(container)
    }
  }

  const exportSelectionJpg = async () => {
    if (!selStart || !selEnd) return
    setSelectionMode(false)

    const [year, month] = activeSchedule.month.split('-').map(Number)
    const headerText = `${getMonthName(month)} ${year}`

    const rowFrom = Math.min(selStart.row, selEnd.row)
    const rowTo = Math.max(selStart.row, selEnd.row)
    const colFrom = Math.min(selStart.col, selEnd.col)
    const colTo = Math.max(selStart.col, selEnd.col)

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '-9999px'
    container.style.left = '0'
    container.style.background = 'white'
    container.style.padding = '20px'
    container.style.width = 'fit-content'

    const headerEl = document.createElement('div')
    headerEl.style.fontSize = '18px'
    headerEl.style.fontWeight = 'bold'
    headerEl.style.marginBottom = '12px'
    headerEl.style.textAlign = 'center'
    headerEl.style.fontFamily = 'Arial, sans-serif'
    headerEl.textContent = headerText
    container.appendChild(headerEl)

    const tableWrapper2 = document.createElement('div')
    tableWrapper2.style.overflow = 'hidden'
    tableWrapper2.style.display = 'inline-block'
    const table = buildExportTable(
      { from: rowFrom, to: rowTo },
      { from: colFrom, to: colTo }
    )
    if (table) tableWrapper2.appendChild(table)
    container.appendChild(tableWrapper2)

    document.body.appendChild(container)
    try {
      const canvas = await html2canvas(container, { useCORS: true, scale: 2 })
      const link = document.createElement('a')
      link.download = `grafik-${activeSchedule.month}-segment.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
    } finally {
      document.body.removeChild(container)
    }
    setSelStart(null)
    setSelEnd(null)
  }

  const cancelSelection = () => {
    setSelectionMode(false)
    setSelStart(null)
    setSelEnd(null)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Шапка */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">График сотрудников</h1>
            <button
              onClick={toggle}
              className="px-2.5 py-1.5 text-sm rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              aria-label="Переключить тему"
            >
              {theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => exportToJson(appData)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Скачать JSON"
            >
              📥 JSON
            </button>
            {activeSchedule && (
              <button
                onClick={() => exportToExcel(activeSchedule).catch(console.error)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Скачать Excel"
              >
                📊 Excel
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Загрузить JSON"
            >
              📤 Загрузить
            </button>
            <button
              onClick={() => setShowJpgModal(true)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Экспорт в JPG"
            >
              🖼 JPG
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Печать"
            >
              🖨 Печать
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  try {
                    const imported = await importFromJson(file)
                    setAppData(imported)
                  } catch {
                    alert('Ошибка при загрузке файла')
                  }
                }
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </header>

      {/* Вкладки графиков */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 no-print">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          {appData.schedules.map(s => (
            <div
              key={s.id}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 cursor-pointer transition-colors shrink-0 ${
                s.id === appData.activeScheduleId
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              onClick={() => setAppData(prev => ({ ...prev, activeScheduleId: s.id }))}
            >
              {editingNameId === s.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={finishRenameSchedule}
                  onKeyDown={e => {
                    if (e.key === 'Enter') finishRenameSchedule()
                    if (e.key === 'Escape') { setEditingNameId(null); setEditingName('') }
                  }}
                  className="bg-white border border-blue-300 rounded px-1 py-0.5 text-sm w-32"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span onDoubleClick={(e) => { e.stopPropagation(); startRenameSchedule(s.id, s.name) }}>
                  {s.name}
                </span>
              )}
              {appData.schedules.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeSchedule(s.id) }}
                  className="ml-1 text-gray-400 hover:text-red-500 text-xs"
                  title="Удалить график"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addSchedule}
            className="px-3 py-2 text-sm text-blue-500 hover:text-blue-700 font-bold shrink-0"
            title="Новый график (копия текущего)"
          >
            +
          </button>
          <button
            onClick={addScheduleCurrentMonth}
            className="px-3 py-2 text-sm text-blue-500 hover:text-blue-700 shrink-0"
            title="Новый график текущего месяца"
          >
            + текущий месяц
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 shrink-0"
            title="Перенести данные из другого графика"
          >
            📋 Перенести
          </button>
        </div>
      </div>

      {/* Вкладки функций */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 no-print">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {(['schedule', 'settings', 'statistics'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'schedule' && '📅 График'}
              {tab === 'settings' && '⚙️ Настройки'}
              {tab === 'statistics' && '📊 Статистика'}
            </button>
          ))}
        </div>
      </nav>

      {/* Содержимое */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {selectionMode && (
          <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Выделите область для экспорта ( клик + перетащите ), затем нажмите «Готово»
            </span>
            <div className="flex gap-2">
              <button
                onClick={exportSelectionJpg}
                disabled={!selStart || !selEnd}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Готово
              </button>
              <button
                onClick={cancelSelection}
                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
        {activeTab === 'schedule' && activeSchedule && (
          <ScheduleTable
            data={activeSchedule}
            onChange={updateSchedule}
            selectionMode={selectionMode}
            selStart={selStart}
            selEnd={selEnd}
            onSelectionChange={(start, end) => { setSelStart(start); setSelEnd(end) }}
          />
        )}
        {activeTab === 'settings' && activeSchedule && (
          <Settings data={activeSchedule} onChange={updateSchedule} />
        )}
        {activeTab === 'statistics' && activeSchedule && (
          <Statistics data={activeSchedule} />
        )}
      </main>

      {/* Модалка переноса данных */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Перенести данные</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Выберите график, из которого скопировать расписание в текущий «{activeSchedule?.name}»:
            </p>
            <div className="space-y-2 mb-4">
              {appData.schedules
                .filter(s => s.id !== appData.activeScheduleId)
                .map(s => (
                  <button
                    key={s.id}
                    onClick={() => transferData(s.id)}
                    className="w-full text-left px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-blue-300 transition-colors dark:text-gray-100"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-400">
                      {s.month} · {s.employees.length} сотр. · {Object.values(s.schedule).reduce((sum, emp) => sum + Object.keys(emp).length, 0)} заполнений
                    </div>
                  </button>
                ))}
              {appData.schedules.filter(s => s.id !== appData.activeScheduleId).length === 0 && (
                <div className="text-sm text-gray-400">Нет других графиков для переноса</div>
              )}
            </div>
            <button
              onClick={() => setShowTransferModal(false)}
              className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Модалка JPG экспорта */}
      {showJpgModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Экспорт в JPG</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Что экспортировать?</p>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => exportJpg('full')}
                className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-blue-300 transition-colors dark:text-gray-100"
              >
                <div className="font-medium">Целиком</div>
                <div className="text-xs text-gray-400">Вся таблица с заголовком «Месяц Год»</div>
              </button>
              <button
                onClick={() => exportJpg('selection')}
                className="w-full text-left px-4 py-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-blue-300 transition-colors dark:text-gray-100"
              >
                <div className="font-medium">Выделить часть</div>
                <div className="text-xs text-gray-400">Выделите нужную область на таблице</div>
              </button>
            </div>
            <button
              onClick={() => setShowJpgModal(false)}
              className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
