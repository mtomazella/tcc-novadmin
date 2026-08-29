import { A4Page } from './A4Page'
import { SectionCallout } from './pageComponents'
import {
  DARK_BORDER_STYLE,
  DARK_COLOR,
  FONT_SIZE_BODY,
  FONT_SIZE_TITLE,
  GRAY_FILL_COLOR,
} from './documentConstants'

export function DeAcordoPage({
  pageNumber,
  quoteNumber,
}: {
  pageNumber: number
  quoteNumber: string
}) {
  return (
    <A4Page pageNumber={pageNumber} quoteNumber={quoteNumber}>
      <div
        style={{
          paddingTop: '15mm',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: FONT_SIZE_TITLE,
          color: DARK_COLOR,
        }}
      >
        DE ACORDO
      </div>

      <SectionCallout text="EMPRESA EXEMPLO" marginTop="6mm" marginBottom="0" />

      <div
        style={{
          borderLeft: DARK_BORDER_STYLE,
          borderRight: DARK_BORDER_STYLE,
          borderBottom: DARK_BORDER_STYLE,
          padding: '4mm',
          marginBottom: '4mm',
        }}
      >
        <p
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            textAlign: 'center',
            margin: '0 0 30mm 0',
          }}
        >
          Atenciosamente, de acordo:
        </p>

        <div style={{ display: 'flex', gap: '8mm' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{ borderBottom: DARK_BORDER_STYLE, marginBottom: '2mm' }}
            />
            <p
              style={{
                fontSize: FONT_SIZE_BODY,
                lineHeight: '1.4',
                fontWeight: 'bold',
                margin: 0,
              }}
            >
              Nome Completo
            </p>
            <p
              style={{ fontSize: FONT_SIZE_BODY, lineHeight: '1.4', margin: 0 }}
            >
              Diretor Geral
            </p>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{ borderBottom: DARK_BORDER_STYLE, marginBottom: '2mm' }}
            />
            <p
              style={{
                fontSize: FONT_SIZE_BODY,
                lineHeight: '1.4',
                fontWeight: 'bold',
                margin: 0,
              }}
            >
              Nome Completo
            </p>
            <p
              style={{ fontSize: FONT_SIZE_BODY, lineHeight: '1.4', margin: 0 }}
            >
              Diretor Comercial
            </p>
            <p
              style={{ fontSize: FONT_SIZE_BODY, lineHeight: '1.4', margin: 0 }}
            >
              Tel. (00) 00000-0000
            </p>
          </div>
        </div>
      </div>

      <p
        style={{
          fontSize: FONT_SIZE_BODY,
          lineHeight: '1.4',
          textAlign: 'center',
          margin: 0,
        }}
      >
        Favor devolver documento com campo abaixo preenchido:
      </p>

      <SectionCallout text="CONTRATANTE" marginTop="4mm" marginBottom="0" />

      <div
        style={{
          borderLeft: DARK_BORDER_STYLE,
          borderRight: DARK_BORDER_STYLE,
          borderBottom: DARK_BORDER_STYLE,
          padding: '3mm 0',
        }}
      >
        {(['DE ACORDO:', 'NOME:', 'CPF:'] as const).map(label => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '3mm 3mm',
            }}
          >
            <span
              style={{
                fontSize: FONT_SIZE_BODY,
                fontWeight: 'bold',
                width: '30mm',
                flexShrink: 0,
                lineHeight: '1.4',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
            <div
              style={{
                flex: 1,
                height: '6mm',
                backgroundColor: GRAY_FILL_COLOR,
              }}
            />
          </div>
        ))}
        <div style={{ padding: '5mm 4mm', textAlign: 'center' }}>
          <span style={{ fontSize: FONT_SIZE_BODY, lineHeight: '1.4' }}>
            São Paulo, __________ de ________________________ de 2026.
          </span>
        </div>
      </div>
    </A4Page>
  )
}
