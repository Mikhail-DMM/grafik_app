export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate()
}

export const getDayOfWeek = (year: number, month: number, day: number): number => {
  return new Date(year, month - 1, day).getDay()
}

export const isWeekend = (year: number, month: number, day: number): boolean => {
  const dow = getDayOfWeek(year, month, day)
  return dow === 0 || dow === 6 // воскресенье или суббота
}

export const getDayName = (dayOfWeek: number): string => {
  const names = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return names[dayOfWeek]
}

export const generateId = (): string => {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const getMonthName = (month: number): string => {
  const names = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return names[month - 1]
}
