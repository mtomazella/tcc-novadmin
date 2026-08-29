import { AlignmentType, Paragraph, TextRun } from 'docx'
import {
  BLACK_COLOR,
  BODY_FONT_HALF_PT,
  BULLET_LIST_REF,
  CONTENT_SIDE_PADDING_MM,
  mmToTwip,
} from './constants'

interface InlineMark {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  fontSize?: number
}

function rgbToHex(colorValue: string): string {
  if (colorValue.startsWith('#')) return colorValue.slice(1)
  const rgbMatch = colorValue.match(
    /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/,
  )
  if (rgbMatch) {
    return [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
      .map(channel => parseInt(channel, 10).toString(16).padStart(2, '0'))
      .join('')
  }
  return BLACK_COLOR
}

function parseInlineNode(node: Node, inheritedMarks: InlineMark): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    if (!text) return []
    return [
      new TextRun({
        text,
        bold: inheritedMarks.bold,
        italics: inheritedMarks.italic,
        underline: inheritedMarks.underline ? {} : undefined,
        color: inheritedMarks.color ?? BLACK_COLOR,
        size: inheritedMarks.fontSize,
      }),
    ]
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []
  const element = node as Element
  const tagName = element.tagName.toLowerCase()
  const marks: InlineMark = { ...inheritedMarks }
  if (tagName === 'strong' || tagName === 'b') marks.bold = true
  if (tagName === 'em' || tagName === 'i') marks.italic = true
  if (tagName === 'u') marks.underline = true
  if (tagName === 'span') {
    const styleAttr = element.getAttribute('style') ?? ''
    const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/)
    if (colorMatch) marks.color = rgbToHex(colorMatch[1].trim())
  }
  return Array.from(element.childNodes).flatMap(childNode =>
    parseInlineNode(childNode, marks),
  )
}

function extractTextAlign(
  element: Element,
): (typeof AlignmentType)[keyof typeof AlignmentType] {
  const textAlign = (element as HTMLElement).style?.textAlign
  if (textAlign === 'center') return AlignmentType.CENTER
  if (textAlign === 'right') return AlignmentType.RIGHT
  if (textAlign === 'left') return AlignmentType.LEFT
  // Default to justify (matches the HTML CSS default for .document-rich-content)
  return AlignmentType.DISTRIBUTE
}

function blockElementToParagraph(
  element: Element,
  listIndentMm: number,
  bulletPrefix: string,
  hangingMm: number = 0,
  baseIndentMm: number = CONTENT_SIDE_PADDING_MM,
): Paragraph {
  const tagName = element.tagName.toLowerCase()
  const isHeading1 = tagName === 'h1'
  const isHeading2 = tagName === 'h2'
  const headingFontSize =
    isHeading1 || isHeading2 ? BODY_FONT_HALF_PT : undefined
  const baseMarks: InlineMark = {
    bold: isHeading1 || isHeading2,
    fontSize: headingFontSize,
  }
  const textRuns = Array.from(element.childNodes).flatMap(childNode =>
    parseInlineNode(childNode, baseMarks),
  )
  const prefixRun = bulletPrefix
    ? [new TextRun({ text: bulletPrefix, color: BLACK_COLOR })]
    : []
  return new Paragraph({
    alignment: extractTextAlign(element),
    indent: {
      left: mmToTwip(baseIndentMm + listIndentMm),
      hanging: hangingMm > 0 ? mmToTwip(hangingMm) : undefined,
      right: mmToTwip(baseIndentMm),
    },
    spacing: { after: mmToTwip(2) },
    children: [...prefixRun, ...textRuns],
  })
}

export function htmlToParagraphs(
  html: string,
  baseIndentMm: number = CONTENT_SIDE_PADDING_MM,
): Paragraph[] {
  if (!html.trim()) return []
  const domDocument = new DOMParser().parseFromString(html, 'text/html')
  const paragraphs: Paragraph[] = []

  function processElement(
    element: Element,
    listType?: 'bullet' | 'ordered',
    listIndex?: { value: number },
  ): void {
    const tagName = element.tagName.toLowerCase()
    if (tagName === 'ul') {
      Array.from(element.children).forEach(listItem =>
        processElement(listItem, 'bullet'),
      )
      return
    }
    if (tagName === 'ol') {
      const counter = { value: 1 }
      Array.from(element.children).forEach(listItem =>
        processElement(listItem, 'ordered', counter),
      )
      return
    }
    if (tagName === 'li') {
      if (listType === 'bullet') {
        const textRuns = Array.from(element.childNodes).flatMap(childNode =>
          parseInlineNode(childNode, {}),
        )
        paragraphs.push(
          new Paragraph({
            numbering: { reference: BULLET_LIST_REF, level: 0 },
            alignment: extractTextAlign(element),
            indent: { right: mmToTwip(baseIndentMm) },
            spacing: { after: mmToTwip(2) },
            children: textRuns,
          }),
        )
      } else {
        const prefix = `${listIndex!.value++}. `
        paragraphs.push(
          blockElementToParagraph(element, 6, prefix, 6, baseIndentMm),
        )
      }
      return
    }
    if (['p', 'h1', 'h2'].includes(tagName)) {
      paragraphs.push(blockElementToParagraph(element, 0, '', 0, baseIndentMm))
      return
    }
    Array.from(element.children).forEach(child => processElement(child))
  }

  Array.from(domDocument.body.children).forEach(child => processElement(child))
  return paragraphs
}
