import ExcelJS from 'exceljs'
import { ScheduleData } from '../types'

export const exportToExcel = async (data: ScheduleData): Promise<void> => {
  const [year, month] = data.month.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('График')

  const headerBg = 'E5E7EB'
  const borderStyle: Partial<ExcelJS.Border> = {
    style: 'thin',
    color: { argb: 'FF999999' },
  }
  const allBorders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  }

  // --- Заголовки ---
  const headerRow = ws.addRow(['День', 'Дата', ...data.employees.map(e => e.name)])
  headerRow.height = data.verticalNames ? 90 : 20
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 11, name: 'Arial' }
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `FF${headerBg}` },
    }
    cell.border = allBorders

    // Поворот имён сотрудников
    if (colNumber >= 3 && data.verticalNames) {
      cell.alignment.textRotation = 255
    }
  })

  // --- Строки данных ---
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dow = date.getDay()
    const isWk = dow === 0 || dow === 6
    const dateKey = `${data.month}-${String(day).padStart(2, '0')}`

    const rowValues: (string | number)[] = [
      dayNames[dow],
      `${day}.${month}`,
      ...data.employees.map(emp => data.schedule[emp.id]?.[dateKey] || ''),
    ]

    const row = ws.addRow(rowValues)
    row.height = data.verticalNames ? 60 : 20

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { bold: colNumber <= 2, size: colNumber >= 3 ? 12 : 11, name: 'Arial' }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = allBorders

      // Фон выходных
      if (isWk) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: `FF${headerBg}` },
        }
      }

      // Цвет ячейки смены
      if (colNumber >= 3) {
        const value = cell.value as string
        if (value) {
          const legendItem = data.legend.find(l => l.code === value)
          if (legendItem) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: `FF${legendItem.color.replace('#', '')}` },
            }
            cell.font = { bold: true, size: 12, name: 'Arial' }
          }
        }
      }
    })
  }

  // --- Ширина колонок ---
  ws.getColumn(1).width = data.verticalNames ? 8 : 10
  ws.getColumn(2).width = 8
  for (let i = 0; i < data.employees.length; i++) {
    ws.getColumn(i + 3).width = data.verticalNames ? 6 : 15
  }

  // --- Сохранение ---
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `grafik-${data.month}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
