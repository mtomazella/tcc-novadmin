import React from 'react'

interface DocumentPreviewProps {
  quoteNumber: string
  clientName: string
  obraName: string
  documentOptions: Record<string, unknown>
}

interface Revision {
  number: string
  description: string
}

interface Responsaveis {
  orcamentista?: string
  revisor?: string
  aprovado?: string
}

const cellStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '4px 8px',
  fontSize: '11px',
}

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: '#2d2d2d',
  color: '#fff',
  fontWeight: 'bold',
  textAlign: 'center',
}

const labelCellStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 'bold',
  backgroundColor: '#f5f5f5',
  width: '160px',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  borderBottom: '2px solid #1a1a1a',
  paddingBottom: '4px',
  marginBottom: '12px',
  marginTop: '24px',
}

export default function DocumentPreview({
  quoteNumber,
  clientName,
  obraName,
  documentOptions,
}: DocumentPreviewProps) {
  const revisions = (documentOptions.revisions as Revision[] | undefined) ?? []
  const responsaveis =
    (documentOptions.responsaveis as Responsaveis | undefined) ?? {}
  const escopoTexto =
    (documentOptions.escopoTexto as string | undefined) ?? '[A preencher]'
  const previsto = (documentOptions.previsto as string[] | undefined) ?? []
  const naoPrevisto =
    (documentOptions.naoPrevisto as string[] | undefined) ?? []

  return (
    <div
      id="document-preview"
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '210mm',
        margin: '0 auto',
        backgroundColor: '#fff',
        padding: '20mm 15mm',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        minHeight: '297mm',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 6px',
          }}
        >
          PROPOSTA PARA FORNECIMENTO DE FÔRMA PRONTA
        </h1>
        <p style={{ fontSize: '12px', margin: 0, color: '#444' }}>
          N° PROPOSTA — {quoteNumber}
        </p>
      </div>

      {/* ── Dados do cliente ──────────────────────────────────────────────── */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '8px',
        }}
      >
        <tbody>
          {[
            ['CLIENTE', clientName],
            ['OBRA', obraName],
            ['ENDEREÇO', (documentOptions.endereco as string) ?? ''],
            ['A.C.', (documentOptions.ac as string) ?? ''],
            ['TEL.', (documentOptions.tel as string) ?? ''],
            ['E-MAIL', (documentOptions.email as string) ?? ''],
            ['VENDEDOR', (documentOptions.vendedor as string) ?? ''],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={labelCellStyle}>{label}:</td>
              <td style={cellStyle}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Sumário ───────────────────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Sumário</div>
      <ol style={{ fontSize: '11px', paddingLeft: '20px', margin: '0 0 8px' }}>
        {[
          'Histórico',
          'Responsáveis Técnicos',
          'Escopo de Fornecimento',
          'Delimitação',
          'Áreas de Fornecimento',
          'Metragens',
          'Condições Gerais de Fornecimento',
        ].map(item => (
          <li key={item} style={{ marginBottom: '3px' }}>
            {item}
          </li>
        ))}
      </ol>

      {/* ── Histórico ─────────────────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Histórico</div>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          margin: '0 0 6px',
        }}
      >
        Revisões:
      </p>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '8px',
        }}
      >
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, width: '120px' }}>N° Revisão</th>
            <th style={headerCellStyle}>Alterações Solicitadas</th>
          </tr>
        </thead>
        <tbody>
          {revisions.length > 0 ? (
            revisions.map((revision, index) => (
              <tr key={index}>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  {revision.number}
                </td>
                <td style={cellStyle}>{revision.description}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={{ ...cellStyle, textAlign: 'center' }}>R00</td>
              <td style={cellStyle}>Emissão inicial</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Responsáveis Técnicos ─────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Responsáveis Técnicos</div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '8px',
        }}
      >
        <tbody>
          {[
            ['Orçamentista', responsaveis.orcamentista ?? ''],
            ['Revisor', responsaveis.revisor ?? ''],
            ['Aprovado', responsaveis.aprovado ?? ''],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={labelCellStyle}>{label}:</td>
              <td style={cellStyle}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Escopo de Fornecimento ────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Escopo de Fornecimento</div>
      <p style={{ fontSize: '11px', lineHeight: '1.4', margin: '0 0 8px' }}>
        {escopoTexto}
      </p>

      {/* ── Delimitação ───────────────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Delimitação</div>
      <div
        style={{
          border: '2px dashed #bbb',
          borderRadius: '4px',
          padding: '32px',
          textAlign: 'center',
          color: '#999',
          fontSize: '12px',
          marginBottom: '8px',
          minHeight: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Planta baixa a inserir
      </div>

      {/* ── Áreas de Fornecimento ─────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Áreas de Fornecimento</div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '8px',
        }}
      >
        <thead>
          <tr>
            <th style={headerCellStyle}>Elementos</th>
            <th style={{ ...headerCellStyle, width: '80px' }}>Jogos</th>
            <th style={{ ...headerCellStyle, width: '100px' }}>
              Plastificado (m²)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle} colSpan={3}>
              —
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Metragens ─────────────────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Metragens — Resumo de Áreas</div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '8px',
        }}
      >
        <thead>
          <tr>
            <th style={headerCellStyle}>Pavimentos</th>
            <th style={{ ...headerCellStyle, width: '150px' }}>
              Metragens (m²)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}>—</td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>—</td>
          </tr>
        </tbody>
      </table>

      {/* ── Condições Gerais ──────────────────────────────────────────────── */}
      <div style={sectionTitleStyle}>Condições Gerais de Fornecimento</div>

      <p
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          margin: '0 0 6px',
          textTransform: 'uppercase',
        }}
      >
        Previsto:
      </p>
      {previsto.length > 0 ? (
        <ul
          style={{ fontSize: '11px', paddingLeft: '20px', margin: '0 0 12px' }}
        >
          {previsto.map((item, index) => (
            <li key={index} style={{ marginBottom: '3px' }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '11px', color: '#999', margin: '0 0 12px' }}>
          [A preencher]
        </p>
      )}

      <p
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          margin: '0 0 6px',
          textTransform: 'uppercase',
        }}
      >
        Não Previsto:
      </p>
      {naoPrevisto.length > 0 ? (
        <ul
          style={{ fontSize: '11px', paddingLeft: '20px', margin: '0 0 8px' }}
        >
          {naoPrevisto.map((item, index) => (
            <li key={index} style={{ marginBottom: '3px' }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '11px', color: '#999', margin: '0 0 8px' }}>
          [A preencher]
        </p>
      )}
    </div>
  )
}
