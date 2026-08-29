import { BorderStyle, convertMillimetersToTwip } from 'docx'
import type { QuoteElement, QuoteScope } from '@novadmin/lib/types'
import type { QuotePricingOptionRow } from '@novadmin/lib/quote/pricingOptions'

export interface DocxDocumentData {
  quoteNumber: string
  clientName: string
  obraName: string
  documentOptions: Record<string, unknown>
  quoteFiles: Array<{ id: number; name: string; fileContent: string }>
  scopes: QuoteScope[]
  scopeElements: QuoteElement[]
  selectedPricingOption: QuotePricingOptionRow | null
}

// ── Unit helpers ──────────────────────────────────────────────────────────────

export const mmToTwip = convertMillimetersToTwip
export const mmToDocxPx = (mm: number) => Math.round((mm * 96) / 25.4)
// Floating image position offsets use EMU (914400 per inch, 36000 per mm)
export const mmToEmu = (mm: number) => Math.round(mm * 36000)
// docx font sizes are in half-points (e.g. 10.5pt → 21 half-points ≈ 14px)
export const ptToHalfPt = (pt: number) => Math.round(pt * 2)

// ── Layout constants (must mirror DocumentEditor.tsx) ─────────────────────────

export const PAGE_MARGIN_MM = 12
export const LOGO_WIDTH_MM = 70
export const LOGO_LEFT_MARGIN_MM = 10
// Logo cell: left margin + logo width + small gap before mission
export const LOGO_CELL_WIDTH_MM = LOGO_LEFT_MARGIN_MM + LOGO_WIDTH_MM + 4
export const MISSION_RIGHT_MARGIN_MM = 18
export const MISSION_TOP_MARGIN_MM = 8
// 14px at 96 dpi ≈ 10.5pt
export const MISSION_FONT_HALF_PT = ptToHalfPt(10.5)
export const FOOTER_IMAGE_WIDTH_MM = 160

// Orange page border: 1mm ≈ 3pt; docx size is in eighths of a point → 24
export const ORANGE_BORDER_SIZE = 24
export const ORANGE_COLOR = '7C3AED'
export const LIGHT_ORANGE_COLOR = 'DDD6FE'
export const BLACK_COLOR = '000000'
// Dark near-black used for table borders and secondary text (not pure black)
export const DARK_COLOR = '1a1a1a'
// Light gray fill for input/empty fields
export const GRAY_FILL_COLOR = 'E5E7EB'

// Floating logo vertical anchor from page top edge.
// quote-icon.png is 1600×599 px → at 70mm wide, height = 70 / (1600/599) ≈ 26.2mm.
// Logo bottom ≈ 14 + 26.2 = 40.2mm from page top → body starts 15mm below that.
export const LOGO_VERTICAL_OFFSET_FROM_PAGE_MM = 14
export const BODY_TOP_MARGIN_MM = 56 // ≈ logo bottom (40mm) + 15mm gap + 1mm rounding
export const BODY_BOTTOM_MARGIN_MM = 30
export const HEADER_GUTTER_MM = PAGE_MARGIN_MM
export const FOOTER_GUTTER_MM = PAGE_MARGIN_MM

// Content width available inside body margins (no orange border subtracted — it's page-level)
export const BODY_CONTENT_WIDTH_MM = 210 - 2 * PAGE_MARGIN_MM // = 186mm

// 15mm side padding inside the orange border (mirrors the HTML content div padding)
export const CONTENT_SIDE_PADDING_MM = 15
// Effective content width after side padding
export const CONTENT_EFFECTIVE_WIDTH_MM =
  BODY_CONTENT_WIDTH_MM - 2 * CONTENT_SIDE_PADDING_MM // = 156mm

// ── Font sizes (keep in sync with DocumentEditor.tsx FONT_SIZE_* variables) ───

export const TITLE_FONT_HALF_PT = ptToHalfPt(18)
export const CALLOUT_FONT_HALF_PT = ptToHalfPt(14)
export const BODY_FONT_HALF_PT = ptToHalfPt(12)
export const SMALL_FONT_HALF_PT = ptToHalfPt(11)
export const TOC_FONT_HALF_PT = ptToHalfPt(10)
export const PAGE_NUMBER_FONT_HALF_PT = ptToHalfPt(9)

// ── Bullet list ───────────────────────────────────────────────────────────────

export const BULLET_LIST_REF = 'nova-bullet-list'
export const BULLET_LIST_INDENT_MM = 5

// ── TOC constants (mirrors DocumentEditor.tsx) ────────────────────────────────

export const TOC_SUBSECTION_INDENT_MM = 10
// Measured from the page left margin; equals content right edge (15mm indent + 156mm wide)
export const TOC_RIGHT_TAB_MM =
  CONTENT_SIDE_PADDING_MM + CONTENT_EFFECTIVE_WIDTH_MM

// ── Border helpers ────────────────────────────────────────────────────────────

export const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }

export const TABLE_NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
}

export const CELL_NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
}

export const DARK_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: DARK_COLOR,
}

export const ALL_DARK_BORDERS = {
  top: DARK_BORDER,
  bottom: DARK_BORDER,
  left: DARK_BORDER,
  right: DARK_BORDER,
}

// ── Common cell margins ───────────────────────────────────────────────────────

export const TABLE_CELL_MARGINS_SM = {
  top: mmToTwip(1),
  bottom: mmToTwip(1),
  left: mmToTwip(2),
  right: mmToTwip(2),
}

// ── Section spacing ───────────────────────────────────────────────────────────

export const SECTION_TITLE_SPACING = {
  before: mmToTwip(10),
  after: mmToTwip(6),
}

export const SECTION_TITLE_SPACING_NO_AFTER = {
  before: mmToTwip(10),
  after: 0,
}

// ── Orange page border (all sides, 1mm) ──────────────────────────────────────

const PAGE_BORDER_SPACE_PT = Math.round(PAGE_MARGIN_MM * (72 / 25.4))

export const ORANGE_PAGE_BORDER = {
  style: BorderStyle.SINGLE,
  size: ORANGE_BORDER_SIZE,
  color: ORANGE_COLOR,
  space: PAGE_BORDER_SPACE_PT,
}

// ── Default content ───────────────────────────────────────────────────────────

export const APRESENTACAO_DEFAULT_HTML =
  '<p>Pelo presente temos o prazer de apresentar nossa <strong><span style="color: #7C3AED">proposta técnica/ comercial</span></strong> para o <strong><span style="color: #7C3AED">fornecimento do sistema de forma pronta para a obra em referência</span></strong>, proposta elaborada conforme projetos encaminhados pela contratante.</p><p>Esta proposta tem como objetivo <strong><span style="color: #7C3AED">determinar as condições comerciais informando áreas, valores, dados para fabricação das formas e condições gerais do fornecimento.</span></strong></p>'
