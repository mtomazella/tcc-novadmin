import * as XLSX from 'xlsx'
import type { ImportCellValue } from '@novadmin/lib/quote/import'

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ';' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

const readXlsxAsGrid = async (file: File): Promise<ImportCellValue[][]> => {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  }) as ImportCellValue[][]
}

const readCsvAsGrid = async (file: File): Promise<ImportCellValue[][]> => {
  const content = await file.text()
  const lines = content.split(/\r?\n/)
  return lines.map(parseCsvLine)
}

export const readFileAsGrid = async (
  file: File,
): Promise<ImportCellValue[][]> => {
  const isXlsx = /\.xlsx$/i.test(file.name)
  return isXlsx ? readXlsxAsGrid(file) : readCsvAsGrid(file)
}
