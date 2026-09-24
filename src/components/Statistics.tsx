import React from 'react'
import { ScheduleData } from '../types'
import { getDaysInMonth } from '../utils/helpers'

interface Props {
  data: ScheduleData
}

interface EmployeeStats {
  empId: string
  empName: string
  total: number
  byCode: Record<string, number>
}

export const Statistics: React.FC<Props> = ({ data }) => {
  const [year, month] = data.month.split('-').map(Number)
  const daysInMonth = getDaysInMonth(year, month)

  const stats: EmployeeStats[] = data.employees.map(emp => {
    const byCode: Record<string, number> = {}

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${data.month}-${String(day).padStart(2, '0')}`
      const code = data.schedule[emp.id]?.[dateKey]
      if (code) {
        byCode[code] = (byCode[code] || 0) + 1
      }
    }

    const total = Object.values(byCode).reduce((sum, n) => sum + n, 0)

    return { empId: emp.id, empName: emp.name, total, byCode }
  })

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Статистика за {new Date(year, month - 1).toLocaleString('ru', { month: 'long', year: 'numeric' })}
      </h2>

      <div className="overflow-x-auto">
        <table className="border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-3 py-2 bg-gray-100 text-left">
                Сотрудник
              </th>
              {data.legend.map(item => (
                <th
                  key={item.code}
                  className="border border-gray-300 px-3 py-2 bg-gray-100 text-center"
                >
                  <span
                    className="inline-block px-2 py-0.5 rounded text-sm"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.code}
                  </span>
                </th>
              ))}
              <th className="border border-gray-300 px-3 py-2 bg-gray-100 text-center">
                Итого
              </th>
            </tr>
          </thead>
          <tbody>
            {stats.map(s => (
              <tr key={s.empId}>
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {s.empName}
                </td>
                {data.legend.map(item => (
                  <td
                    key={item.code}
                    className="border border-gray-300 px-3 py-2 text-center"
                  >
                    {s.byCode[item.code] || 0}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  {s.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
