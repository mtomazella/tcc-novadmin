import type { CSSProperties } from 'react'

// ── Brand colors ──────────────────────────────────────────────────────────────
export const ORANGE_COLOR = '#7C3AED'
export const LIGHT_ORANGE_COLOR = '#DDD6FE'
export const DARK_COLOR = '#1a1a1a'
export const GRAY_FILL_COLOR = '#e5e7eb'

// ── Border shorthands ─────────────────────────────────────────────────────────
export const DARK_BORDER_STYLE = '1px solid #1a1a1a'

// ── Font sizes — keep in sync with exportDocx.ts ─────────────────────────────
export const FONT_SIZE_TITLE = '18pt'
export const FONT_SIZE_CALLOUT = '12pt'
export const FONT_SIZE_BODY = '12pt'
export const FONT_SIZE_TOC = '10pt'
export const TOC_SUBSECTION_COLOR = '#555555'

// ── Left panel layout ─────────────────────────────────────────────────────────
export const LEFT_PANEL_WIDTH = 504
// A4 height at 96 DPI + 24px bottom margin per A4Page (margin: '0 auto 24px').
export const PAGE_SLOT_PX = Math.round(297 * (96 / 25.4)) + 24
export const LEFT_PANEL_PADDING_TOP_PX = 24
export const LEFT_PANEL_SLOT_PADDING_TOP_PX = 170

// ── Pagination ────────────────────────────────────────────────────────────────
// Conservative budget per page: real available height ≈ 230mm; using 175mm
// leaves a safety margin so page breaks happen before the content boundary.
export const CONTENT_AVAILABLE_HEIGHT_MM = 175
// Width of the content div inside A4Page in px (156mm = 210mm − 2×12mm outer − 2×15mm inner)
export const CONTENT_AREA_WIDTH_PX = Math.round(156 * (96 / 25.4))

// ── Left panel field styles ───────────────────────────────────────────────────
export const FIELD_LABEL_STYLE: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#374151',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '3px',
  letterSpacing: '0.03em',
}

export const FIELD_DISPLAY_STYLE: CSSProperties = {
  fontSize: '14px',
  color: '#1a1a1a',
  padding: '4px 0',
  minHeight: '24px',
}

export const INPUT_STYLE: CSSProperties = {
  width: '100%',
  fontSize: '14px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  padding: '4px 6px',
  outline: 'none',
  boxSizing: 'border-box',
}

export const DIVIDER_STYLE: CSSProperties = {
  height: '1px',
  background: '#e5e7eb',
  margin: '2px 0',
}

// ── Document section list ─────────────────────────────────────────────────────
// Delimitação sections are injected between escopo (index 1) and areas (index 2).
export const FIXED_DOCUMENT_SECTIONS = [
  { key: 'historico', title: 'HISTÓRICO' },
  { key: 'escopo', title: 'ESCOPO DE FORNECIMENTO' },
]

// ── Default content ───────────────────────────────────────────────────────────
export const APRESENTACAO_DEFAULT_HTML =
  '<p>Pelo presente temos o prazer de apresentar nossa <strong><span style="color: #7C3AED">proposta técnica/ comercial</span></strong> para o <strong><span style="color: #7C3AED">fornecimento do sistema de forma pronta para a obra em referência</span></strong>, proposta elaborada conforme projetos encaminhados pela contratante.</p><p>Esta proposta tem como objetivo <strong><span style="color: #7C3AED">determinar as condições comerciais informando áreas, valores, dados para fabricação das formas e condições gerais do fornecimento.</span></strong></p>'

export const NAO_PREVISTO_DEFAULT_HTML =
  '<ol><li><p style="text-align: justify;"><strong>Fundações:</strong></p></li></ol><ul><li><p style="text-align: justify;">Não está previsto forma para fundação (será executado em obra pela contratante).</p></li></ul><p style="text-align: justify;"></p><ol start="2"><li><p style="text-align: justify;"><strong>Estruturas:</strong></p></li></ol><ul><li><p style="text-align: justify;">Não está previsto forma para cortinas, incluindo pilares e vigas contidos nas mesmas.</p></li></ul><ul><li><p style="text-align: justify;">Não está previsto forma para as vigas de coroamento.</p></li><li><p style="text-align: justify;">Não está previsto forma para vigas e paredes maiores que 3,00m.</p></li><li><p style="text-align: justify;">Não está previsto forma para escadas, serão fornecidas 40 chapas para execução em obra.</p></li><li><p style="text-align: justify;">Não está previsto forma e nem projetos para andares superiores à cobertura (execução pela contratante com material e mão de obra próprios).</p></li><li><p style="text-align: justify;">Não está previsto forma presa para pé direito menor que 6,00m .</p></li><li><p style="text-align: justify;">Não está previsto jogo de garfo.</p></li></ul><p style="text-align: justify;"></p><ol start="3"><li><p style="text-align: justify;"><strong>Escoramento e Travamentos:</strong></p></li></ol><ul><li><p style="text-align: justify;"><strong>Não está previsto travamentos para pilares e vigas (com metálico por conta da contratante).</strong></p></li><li><p style="text-align: justify;"><strong>Não está previsto escoramento das lajes (com metálico por conta da contratante).</strong></p></li><li><p style="text-align: justify;"><strong>Não está previsto escoramento das vigas (com metálico por conta da contratante).</strong></p></li></ul><p style="text-align: justify;"></p><ol start="4"><li><p style="text-align: justify;"><strong>Acessórios e Madeiras Auxiliares:</strong></p></li></ol><ul><li><p style="text-align: justify;"><strong>Não está previsto neste fornecimento madeiras auxiliares para travamento (galgas, mão francesa, etc.), que será fornecido pela contratante.</strong></p></li><li><p style="text-align: justify;"><strong>Não está previsto madeiras auxiliares para garfos (cunhas, sarrafos de alinhamento para garfos).</strong></p></li></ul><p style="text-align: justify;"></p>'

export const CONDICOES_GERAIS_DEFAULT_HTML =
  '<ol><li><p style="text-align: justify;"><strong>Cota de Saída:</strong></p></li></ol><ul><li><p style="text-align: justify;"></p></li></ul><p style="text-align: justify;"></p><ol start="2"><li><p style="text-align: justify;"><strong>Caderno de Projetos:</strong></p></li></ol><ul><li><p style="text-align: justify;">Fornecimento de 0 jogos de projetos com instruções para montagem (pilar, viga e laje), em cada fornecimento.</p></li></ul><p style="text-align: justify;"></p><ol start="3"><li><p style="text-align: justify;"><strong>Fôrmas e Estruturação</strong>:</p></li></ol><ul><li><p style="text-align: justify;">Está incluso no escopo o fornecimento da ART referente aos projetos desenvolvidos, conforme exigência técnica e normativa.</p></li></ul><ul><li><p style="text-align: justify;">Está previsto 0 jogo de grades para os pilares.</p></li></ul><ul><li><p style="text-align: justify;">Está previsto o uso de estruturação passante, fundo/erguido/mosca no topo das vigas para melhor reaproveitamento nos demais pavimentos subsequentes ao Pavimento Térreo.</p></li></ul><ul><li><p style="text-align: justify;">Está previsto o uso de estruturação solta nas vigas, para melhor reutilização no Pavimento Tipo.</p></li></ul><ul><li><p style="text-align: justify;">Está previsto sistema de estruturação (grades) para painéis de pilares e vigas.</p></li></ul><ul><li><p style="text-align: justify;">Está previsto forma presa para pé direito duplo maior que 6,00m. Deverá ser dada solução junto com o fornecedor de escoramento metálico.</p></li></ul><ul><li><p style="text-align: justify;">Está previsto sarrafo de pressão para vigas (onde necessário).</p></li></ul><ul><li><p style="text-align: justify;">Está previsto reformas e abertura de bocas nos painéis de pilares em obra.</p></li></ul><ul><li><p style="text-align: justify;">Está previsto ajustes nas formas em obra para melhor reaproveitamento das formas. (Pilares, lajes e vigas).</p></li></ul><ul><li><p style="text-align: justify;">Está previsto 0 jogos de gastalhos para os pilares, fornecidos em sarrafos de 15cmx3,00m, pintados na cor vermelha.</p></li></ul><ul><li><p style="text-align: justify;">Previstas fôrmas para piscina, paredes de reservatório e mísulas.</p></li></ul><p style="text-align: justify;"></p><ol start="4"><li><p style="text-align: justify;"><strong>Escoramento e Componentes Complementares:</strong></p></li></ol><ul><li><p style="text-align: justify;"><strong>Todo escoramento de vigas e lajes será com escoramento metálico fornecido pela contratante.</strong></p></li></ul><ul><li><p style="text-align: justify;"><strong>Está previsto o uso de perfis vazados, barra de ancoragem e aprumadores por conta da contratante.</strong></p></li></ul><ol start="5"><li><p style="text-align: justify;"><strong>Madeiras Auxiliares Previstas para Fornecimento:</strong></p></li></ol><ul><li><p style="text-align: justify;">Gastalhos:&nbsp;</p></li><li><p style="text-align: justify;">Sarrafos de pressão: </p></li><li><p style="text-align: justify;">Tolerância: 2mm.</p></li><li><p style="text-align: justify;">Pintura de madeiramento: Tingimento por imersão de acordo com a cor solicitada pelo cliente ou na cor padrão da empresa.</p></li></ul><ol start="6"><li><p style="text-align: justify;"><strong>Chapas Previstas para Fornecimento:</strong></p></li></ol><ul><li><p style="text-align: justify;">Dimensões: </p></li><li><p style="text-align: justify;">Espessura: 1mm.</p></li><li><p style="text-align: justify;">Número de lâminas: 7 e 9 lâminas.</p></li><li><p style="text-align: justify;">Tolerância: 1mm.</p></li><li><p style="text-align: justify;">Pintura de madeiramento: Tingimento por imersão de acordo com a cor solicitada pelo cliente ou na cor padrão da empresa.</p></li></ul><ol start="7"><li><p style="text-align: justify;"><strong>Logística e Transporte:</strong></p></li></ol><ul><li><p style="text-align: justify;"><strong>O transporte está incluso, a descarga do material corre por conta da contratante.</strong></p></li><li><p style="text-align: justify;"><strong>Estão previstas 0 cargas de 0 toneladas para o transporte do material. Caso haja alterações na logística de transporte por solicitação do cliente, os custos adicionais serão repassados a contratante.</strong></p></li></ul><ol start="8"><li><p style="text-align: justify;"><strong>Garantia e Reutilização:</strong></p></li></ol><ul><li><p style="text-align: justify;">Os materiais são garantidos quanto ao número de até 16 reutilizações para formas plastificadas, 06 reutilizações para formas resinadas, e 04 reutilizações para formas cambotadas curvas no período de 06 meses. A garantia refere-se substituição das formas com defeito de fabricação e seguindo as orientações de manuseio. Esta garantia não se estende a mau uso das formas. Ex.: Uso de pé-de-cabra, quedas dos painéis e falta de desmoldantes.</p></li></ul><ol start="9"><li><p style="text-align: justify;"><strong>Assistência Técnica:</strong></p></li></ol><ul><li><p style="text-align: justify;">A assistência técnica será prestada através de visitas periódicas à obra, agendadas com 72 horas de antecedência.</p></li></ul><p style="text-align: justify;"></p>'
