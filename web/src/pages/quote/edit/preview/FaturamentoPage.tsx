import { A4Page } from './A4Page'
import { SectionCallout } from './pageComponents'
import {
  DARK_BORDER_STYLE,
  DARK_COLOR,
  FONT_SIZE_BODY,
  FONT_SIZE_TITLE,
  ORANGE_COLOR,
} from './documentConstants'

const EMISSION_DATE = new Date().toLocaleDateString('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function FaturamentoPage({
  pageNumber,
  quoteNumber,
}: {
  pageNumber: number
  quoteNumber: string
}) {
  return (
    <>
      <A4Page pageNumber={pageNumber} quoteNumber={quoteNumber}>
        <div
          style={{
            paddingTop: '10mm',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: FONT_SIZE_TITLE,
            color: DARK_COLOR,
          }}
        >
          CONDIÇÕES GERAIS DE FATURAMENTO
        </div>

        <SectionCallout text="FATURAMENTO" marginBottom="4mm" marginTop="4mm" />

        <div
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            textAlign: 'justify',
            marginBottom: '4mm',
          }}
        >
          <div style={{ display: 'flex', gap: '2mm', marginBottom: '3mm' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>1.</span>
            <span>
              A condição de pagamento{' '}
              <strong>
                <span style={{ color: ORANGE_COLOR }}>
                  será combinada entre as partes
                </span>
              </strong>{' '}
              no momento do aceite da proposta.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2mm' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>2.</span>
            <span>
              Em caso de atraso no pagamento das parcelas,{' '}
              <strong>
                <span style={{ color: ORANGE_COLOR }}>
                  será aplicada multa de 2% (dois por cento) sobre o valor
                  devido, acrescida de juros de mora de 2% (dois por cento) ao
                  mês.
                </span>
              </strong>
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            textAlign: 'center',
            marginBottom: '3mm',
          }}
        >
          Para o faturamento, disponível duas opções do grupo:
        </p>

        <div
          style={{
            border: DARK_BORDER_STYLE,
            padding: '3mm 4mm',
            textAlign: 'center',
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
          }}
        >
          <strong>Empresa Exemplo LTDA.</strong>
          <br />
          CNPJ: 00.000.000/0001-00
          <br />
          IE: 000.000.000.000
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
          }}
        >
          ou
        </p>

        <div
          style={{
            border: DARK_BORDER_STYLE,
            padding: '3mm 4mm',
            textAlign: 'center',
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            marginBottom: '1mm',
          }}
        >
          <strong>Fornecedor Exemplo LTDA.</strong>
          <br />
          CNPJ: 00.000.000/0002-00
          <br />
          I.E: 000.000.000.001
        </div>

        <SectionCallout text="OBSERVAÇÕES" marginBottom="4mm" marginTop="4mm" />

        <div
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            textAlign: 'justify',
          }}
        >
          <div style={{ display: 'flex', gap: '2mm', marginBottom: '3mm' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>1.</span>
            <span>
              Os materiais descritos neste documento deverão ser entregues
              conforme o{' '}
              <strong>
                <span style={{ color: ORANGE_COLOR }}>
                  cronograma previamente estabelecido em visita técnica
                </span>
              </strong>
              , contado a partir da emissão da Ordem de Fornecimento, no
              endereço indicado nesta proposta.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2mm' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>2.</span>
            <span>
              O prazo de entrega poderá ser ajustado em{' '}
              <strong>
                <span style={{ color: ORANGE_COLOR }}>
                  comum acordo entre as partes, desde que a necessidade seja
                  comunicada com, no mínimo, 3 (três) dias úteis de antecedência
                  em relação às datas previstas no cronograma
                </span>
              </strong>
              . A solicitação deve ser formalizada por e-mail (com confirmação
              de leitura) ou por correspondência com aviso de recebimento.
            </span>
          </div>
        </div>
      </A4Page>

      <A4Page pageNumber={pageNumber + 1} quoteNumber={quoteNumber}>
        <div
          style={{
            paddingTop: '10mm',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: FONT_SIZE_TITLE,
            color: DARK_COLOR,
          }}
        >
          CONDIÇÕES GERAIS DE FATURAMENTO
        </div>

        <SectionCallout text="OBSERVAÇÕES" marginTop="4mm" marginBottom="4mm" />

        <div
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            textAlign: 'justify',
            marginBottom: '4mm',
          }}
        >
          <div style={{ display: 'flex', gap: '2mm', marginBottom: '3mm' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>3.</span>
            <span>
              Caso o material seja produzido e, por qualquer motivo, a
              CONTRATANTE não possa recebê-lo em sua obra,{' '}
              <strong>
                <span style={{ color: ORANGE_COLOR }}>
                  a CONTRATADA estará autorizada, se for o caso, a realizar o
                  faturamento e, como garantia, emitirá uma carta de fiel
                  depositário.
                </span>
              </strong>{' '}
              O material ficará armazenado em nosso estoque até que a entrega
              possa ser efetivada,{' '}
              <strong>
                <span style={{ color: ORANGE_COLOR }}>
                  PELO PRAZO MÁXIMO DE 60 (SESSENTA) DIAS.
                </span>
              </strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2mm' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>4.</span>
            <span>
              Em caso{' '}
              <strong>
                <span style={{ color: ORANGE_COLOR }}>
                  de desistência por parte da CONTRATANTE
                </span>
              </strong>
              , após a assinatura e concordância da presente proposta,{' '}
              <strong>
                <span style={{ color: ORANGE_COLOR }}>
                  será aplicada uma multa de 20% (vinte por cento) sobre o valor
                  total do fornecimento
                </span>
              </strong>
              , a título de ressarcimento pelos custos iniciais já assumidos,
              como visita técnica prévia, elaboração de projeto e demais
              preparativos operacionais.
            </span>
          </div>
        </div>

        <SectionCallout
          text="CONSIDERAÇÕES FINAIS"
          marginTop="4mm"
          marginBottom="4mm"
        />

        <p
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            textAlign: 'justify',
            fontWeight: 'bold',
            marginBottom: '3mm',
          }}
        >
          Esta contratação passará a ter validade a partir do aceite formal
          desta proposta.
        </p>

        <p
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            textAlign: 'justify',
            marginBottom: '3mm',
          }}
        >
          Após o aceite formal desta proposta,{' '}
          <strong>
            <span style={{ color: ORANGE_COLOR }}>
              será emitida uma nota fiscal no valor total do fornecimento,
              acompanhada dos boletos com as datas de vencimento previamente
              estabelecidas.
            </span>
          </strong>{' '}
          Para o envio dos materiais, será emitida uma nota fiscal de simples
          remessa, juntamente com o respectivo romaneio.
        </p>

        <p
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            textAlign: 'justify',
            marginBottom: '3mm',
          }}
        >
          Sem mais para o momento, permanecemos à disposição para quaisquer
          esclarecimentos e aguardamos seu parecer.
        </p>

        <p
          style={{
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
            color: ORANGE_COLOR,
            marginBottom: '6mm',
            textAlign: 'center',
            fontWeight: 'bold',
          }}
        >
          Validade desta proposta: 7 (sete) dias a partir da data de sua
          emissão.
        </p>

        <div
          style={{
            border: DARK_BORDER_STYLE,
            padding: '3mm 4mm',
            textAlign: 'center',
            fontSize: FONT_SIZE_BODY,
            lineHeight: '1.4',
          }}
        >
          <strong>DOCUMENTO EMITIDO EM: {EMISSION_DATE}</strong>
        </div>
      </A4Page>
    </>
  )
}
