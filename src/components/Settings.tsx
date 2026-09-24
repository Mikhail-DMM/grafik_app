import React, { useState } from 'react'
import { ScheduleData } from '../types'
import { generateId } from '../utils/helpers'

interface Props {
  data: ScheduleData
  onChange: (data: ScheduleData) => void
}

export const Settings: React.FC<Props> = ({ data, onChange }) => {
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newLegendCode, setNewLegendCode] = useState('')
  const [newLegendLabel, setNewLegendLabel] = useState('')
  const [newLegendColor, setNewLegendColor] = useState('#4ade80')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplatePattern, setNewTemplatePattern] = useState('')

  // --- Сотрудники ---
  const addEmployee = () => {
    if (!newEmployeeName.trim()) return
    onChange({
      ...data,
      employees: [...data.employees, { id: generateId(), name: newEmployeeName.trim() }],
    })
    setNewEmployeeName('')
  }

  const removeEmployee = (id: string) => {
    onChange({
      ...data,
      employees: data.employees.filter(e => e.id !== id),
    })
  }

  const updateEmployeeName = (id: string, name: string) => {
    onChange({
      ...data,
      employees: data.employees.map(e => (e.id === id ? { ...e, name } : e)),
    })
  }

  // --- Обозначения ---
  const addLegend = () => {
    if (!newLegendCode.trim() || !newLegendLabel.trim()) return
    onChange({
      ...data,
      legend: [...data.legend, { code: newLegendCode.trim(), label: newLegendLabel.trim(), color: newLegendColor }],
    })
    setNewLegendCode('')
    setNewLegendLabel('')
  }

  const removeLegend = (code: string) => {
    onChange({ ...data, legend: data.legend.filter(l => l.code !== code) })
  }

  const updateLegendColor = (code: string, color: string) => {
    onChange({
      ...data,
      legend: data.legend.map(l => (l.code === code ? { ...l, color } : l)),
    })
  }

  // --- Шаблоны ---
  const addTemplate = () => {
    if (!newTemplateName.trim() || !newTemplatePattern.trim()) return
    const pattern = newTemplatePattern.split(/[\s,\-]+/).filter(Boolean).map(s => s.toUpperCase())
    onChange({
      ...data,
      templates: [...data.templates, { id: generateId(), name: newTemplateName.trim(), pattern }],
    })
    setNewTemplateName('')
    setNewTemplatePattern('')
  }

  const removeTemplate = (id: string) => {
    onChange({ ...data, templates: data.templates.filter(t => t.id !== id) })
  }

  return (
    <div className="space-y-8">
      {/* Отображение имён */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Отображение</h2>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            onClick={() => onChange({ ...data, verticalNames: !data.verticalNames })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              data.verticalNames ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                data.verticalNames ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            Имена сотрудников {data.verticalNames ? 'вертикально' : 'горизонтально'}
          </span>
        </label>
      </section>

      {/* Сотрудники */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Сотрудники</h2>
        <div className="space-y-2 mb-3">
          {data.employees.map(emp => (
            <div key={emp.id} className="flex items-center gap-2">
              <input
                type="text"
                value={emp.name}
                onChange={e => updateEmployeeName(emp.id, e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 flex-1"
              />
              <button
                onClick={() => removeEmployee(emp.id)}
                className="px-2 py-1 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newEmployeeName}
            onChange={e => setNewEmployeeName(e.target.value)}
            placeholder="Новый сотрудник"
            className="border border-gray-300 rounded px-2 py-1 flex-1"
            onKeyDown={e => e.key === 'Enter' && addEmployee()}
          />
          <button onClick={addEmployee} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Добавить
          </button>
        </div>
      </section>

      {/* Обозначения */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Обозначения смен</h2>
        <div className="space-y-2 mb-3">
          {data.legend.map(item => (
            <div key={item.code} className="flex items-center gap-2">
              <input
                type="color"
                value={item.color}
                onChange={e => updateLegendColor(item.code, e.target.value)}
                className="w-8 h-8 cursor-pointer"
              />
              <span
                className="px-2 py-1 rounded font-medium min-w-[40px] text-center"
                style={{ backgroundColor: item.color }}
              >
                {item.code}
              </span>
              <span className="flex-1">{item.label}</span>
              <button
                onClick={() => removeLegend(item.code)}
                className="px-2 py-1 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newLegendCode}
            onChange={e => setNewLegendCode(e.target.value)}
            placeholder="Код (Д, Н…)"
            className="border border-gray-300 rounded px-2 py-1 w-20"
          />
          <input
            type="text"
            value={newLegendLabel}
            onChange={e => setNewLegendLabel(e.target.value)}
            placeholder="Название"
            className="border border-gray-300 rounded px-2 py-1 flex-1"
          />
          <input
            type="color"
            value={newLegendColor}
            onChange={e => setNewLegendColor(e.target.value)}
            className="w-8 h-8 cursor-pointer"
          />
          <button onClick={addLegend} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Добавить
          </button>
        </div>
      </section>

      {/* Шаблоны */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Шаблоны повторения</h2>
        <div className="space-y-3 mb-3">
          {data.templates.map(tpl => (
            <div key={tpl.id} className="border border-gray-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{tpl.name}</span>
                <button
                  onClick={() => removeTemplate(tpl.id)}
                  className="px-2 py-1 text-red-500 hover:text-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Паттерн: {tpl.pattern.join(' → ')}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newTemplateName}
            onChange={e => setNewTemplateName(e.target.value)}
            placeholder="Название шаблона"
            className="border border-gray-300 rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            value={newTemplatePattern}
            onChange={e => setNewTemplatePattern(e.target.value)}
            placeholder="Паттерн (Д Д Н Н В В)"
            className="border border-gray-300 rounded px-2 py-1 flex-1"
          />
          <button onClick={addTemplate} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Добавить шаблон
          </button>
        </div>
      </section>
    </div>
  )
}
