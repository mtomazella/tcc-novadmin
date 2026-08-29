import {
  DARK_COLOR,
  FONT_SIZE_CALLOUT,
  ORANGE_COLOR,
} from './documentConstants'

// Orange section divider used across multiple document pages.
export function SectionCallout({
  text,
  marginTop = '4mm',
  marginBottom = '8mm',
  padding,
}: {
  text: string
  marginTop?: string
  marginBottom?: string
  padding?: string
}) {
  return (
    <div
      style={{
        backgroundColor: ORANGE_COLOR,
        border: `1px solid ${DARK_COLOR}`,
        marginTop,
        marginBottom,
        ...(padding !== undefined ? { padding } : {}),
        textAlign: 'center',
        fontSize: FONT_SIZE_CALLOUT,
        fontWeight: 'bold',
        color: DARK_COLOR,
      }}
    >
      {text}
    </div>
  )
}
