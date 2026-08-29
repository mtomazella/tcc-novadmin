import React, { useRef, useEffect, useState } from 'react'
import type { Product, ProductType } from 'types/product'
import GenericModal from 'components/GenericModal'
import {
  parseLocalizedNumber,
  decimalToPercent,
  percentToDecimal,
} from '@novadmin/lib/utils/unitConversion'
import { modifierFieldsByType } from '@novadmin/lib/quote/elements'

type LocalDecimalInputProps = {
  value: number | null
  onChange: (value: number | null) => void
  precision?: number
  toDisplay?: (v: number) => number
  fromDisplay?: (v: number) => number
  disabled?: boolean
  className?: string
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

const LocalDecimalInput = React.forwardRef<
  HTMLInputElement,
  LocalDecimalInputProps
>(function LocalDecimalInput(
  {
    value,
    onChange,
    precision,
    toDisplay = v => v,
    fromDisplay = v => v,
    disabled,
    className,
    onKeyDown,
  },
  ref,
) {
  const toFormatted = (v: number | null): string => {
    if (v == null) return ''
    const display = toDisplay(v)
    return precision != null
      ? display.toLocaleString('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: precision,
        })
      : String(display).replace('.', ',')
  }

  const [local, setLocal] = useState<string>(() => toFormatted(value))
  const commitRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFocusedRef = useRef(false)

  useEffect(() => {
    if (!isFocusedRef.current) setLocal(toFormatted(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, precision])

  useEffect(
    () => () => {
      if (commitRef.current) clearTimeout(commitRef.current)
    },
    [],
  )

  const scheduleCommit = (raw: string) => {
    if (commitRef.current) clearTimeout(commitRef.current)
    commitRef.current = setTimeout(() => {
      onChange(raw === '' ? null : fromDisplay(parseLocalizedNumber(raw)))
    }, 180)
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      className={className}
      value={local}
      disabled={disabled}
      onChange={e => {
        setLocal(e.target.value)
        scheduleCommit(e.target.value)
      }}
      onFocus={() => {
        isFocusedRef.current = true
      }}
      onBlur={() => {
        isFocusedRef.current = false
        if (local !== '') {
          const parsed = parseLocalizedNumber(local)
          setLocal(
            precision != null
              ? parsed.toLocaleString('pt-BR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: precision,
                })
              : String(parsed).replace('.', ','),
          )
        }
      }}
      onKeyDown={onKeyDown}
    />
  )
})

// ── EditProduct ───────────────────────────────────────────────────────────────

interface EditProductProps {
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  setNewProduct: (product: Omit<Product, 'id'>) => void
  newProduct: Omit<Product, 'id'>
  setCurrentProduct: (product: Product | null) => void
  handleAddProduct: () => void
  currentProduct: Product | null
  isLoading: boolean
  disableSave: boolean
}

const EditProduct: React.FC<EditProductProps> = ({
  isModalOpen,
  setIsModalOpen,
  setNewProduct,
  newProduct,
  setCurrentProduct,
  handleAddProduct,
  currentProduct,
  isLoading,
  disableSave,
}) => {
  const nameRef = useRef<HTMLInputElement>(null)
  const shorthandRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const commercialPercentageRef = useRef<HTMLInputElement>(null)
  const projectPercentageRef = useRef<HTMLInputElement>(null)
  const typeRef = useRef<HTMLSelectElement>(null)
  const icChapa1Ref = useRef<HTMLInputElement>(null)
  const icRipa1Ref = useRef<HTMLInputElement>(null)
  const icChapa2Ref = useRef<HTMLInputElement>(null)
  const icRipa2Ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isModalOpen && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [isModalOpen])

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    nextRef: React.RefObject<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
    >,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  const handleLastFieldKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !disableSave) {
      e.preventDefault()
      handleAddProduct()
    }
  }

  const updateModifier = (
    key: keyof NonNullable<Product['modifiers']>,
    value: boolean,
  ) => {
    setNewProduct({
      ...newProduct,
      modifiers: {
        cambotado: newProduct.modifiers?.cambotado || false,
        ripado: newProduct.modifiers?.ripado || false,
        aparente: newProduct.modifiers?.aparente || false,
        paginado: newProduct.modifiers?.paginado || false,
        needsGarfo: newProduct.modifiers?.needsGarfo || false,
        needsGastalho: newProduct.modifiers?.needsGastalho || false,
        garfo: newProduct.modifiers?.garfo || false,
        gastalho: newProduct.modifiers?.gastalho || false,
        fundoDeViga: newProduct.modifiers?.fundoDeViga || false,
        [key]: value,
      },
    })
  }

  const updateConsumptionRate = (
    key: keyof NonNullable<Product['consumptionRates']>,
    value: number | null,
  ) => {
    setNewProduct({
      ...newProduct,
      consumptionRates: {
        icChapa1: newProduct.consumptionRates?.icChapa1 ?? 0,
        icChapa2: newProduct.consumptionRates?.icChapa2 ?? 0,
        icChapa3: newProduct.consumptionRates?.icChapa3 ?? 0,
        icRipa1: newProduct.consumptionRates?.icRipa1 ?? 0,
        icRipa2: newProduct.consumptionRates?.icRipa2 ?? 0,
        icRipa3: newProduct.consumptionRates?.icRipa3 ?? 0,
        [key]: value,
      },
    })
  }

  if (!isModalOpen) return null

  const modifiers = newProduct.modifiers || {
    cambotado: false,
    ripado: false,
    aparente: false,
    paginado: false,
    needsGarfo: false,
    needsGastalho: false,
    garfo: false,
    gastalho: false,
    fundoDeViga: false,
  }

  const consumptionRates = newProduct.consumptionRates || {
    icChapa1: 0,
    icChapa2: 0,
    icChapa3: 0,
    icRipa1: 0,
    icRipa2: 0,
    icRipa3: 0,
  }

  const inputClass =
    'w-full p-2 text-sm border rounded bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <GenericModal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false)
        setCurrentProduct(null)
        setNewProduct({
          name: '',
          shorthand: '',
          description: '',
          typeOnQuote: undefined,
          commercialPercentage: 0,
          projectPercentage: 0,
        })
      }}
      title={currentProduct ? 'Editar Produto' : 'Cadastro de Produto'}
      onSave={handleAddProduct}
      saveButtonText={currentProduct ? 'Atualizar' : 'Salvar'}
      showCancelButton={true}
      isLoading={isLoading}
      disableSave={disableSave}
      size="2xl"
      closeOnBackdropClick={false}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className={labelClass}>Nome *</label>
            <input
              ref={nameRef}
              type="text"
              className={inputClass}
              value={newProduct.name}
              onChange={e =>
                setNewProduct({
                  ...newProduct,
                  name: e.target.value.toUpperCase(),
                })
              }
              onKeyDown={e => handleKeyDown(e, shorthandRef)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className={labelClass}>Sigla *</label>
            <input
              ref={shorthandRef}
              type="text"
              className={inputClass}
              value={newProduct.shorthand}
              onChange={e =>
                setNewProduct({
                  ...newProduct,
                  shorthand: e.target.value.toUpperCase(),
                })
              }
              onKeyDown={e => handleKeyDown(e, descriptionRef)}
              required
              maxLength={3}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <textarea
            ref={descriptionRef}
            className={inputClass}
            value={newProduct.description || ''}
            onChange={e =>
              setNewProduct({
                ...newProduct,
                description: e.target.value.toUpperCase(),
              })
            }
            onKeyDown={e => handleKeyDown(e, commercialPercentageRef)}
            rows={2}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className={labelClass}>% Comercial</label>
            <LocalDecimalInput
              ref={commercialPercentageRef}
              value={newProduct.commercialPercentage}
              onChange={v =>
                setNewProduct({ ...newProduct, commercialPercentage: v })
              }
              onKeyDown={e => handleKeyDown(e, projectPercentageRef)}
              toDisplay={decimalToPercent}
              fromDisplay={percentToDecimal}
              precision={2}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className={labelClass}>% Projeto</label>
            <LocalDecimalInput
              ref={projectPercentageRef}
              value={newProduct.projectPercentage}
              onChange={v =>
                setNewProduct({ ...newProduct, projectPercentage: v })
              }
              onKeyDown={e => handleKeyDown(e, typeRef)}
              toDisplay={decimalToPercent}
              fromDisplay={percentToDecimal}
              precision={2}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Tipo em Orçamento</label>
          <select
            ref={typeRef}
            className={inputClass}
            value={newProduct.typeOnQuote || ''}
            onChange={e =>
              setNewProduct({
                ...newProduct,
                typeOnQuote: e.target.value as ProductType,
              })
            }
            onKeyDown={handleLastFieldKeyDown}
            disabled={isLoading}
          >
            <option value="">Selecione um tipo</option>
            <option value="pilar">Pilar</option>
            <option value="viga">Viga</option>
            <option value="laje">Laje</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        {newProduct.typeOnQuote && (
          <div>
            <label className={labelClass}>Modificadores</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3">
              {[
                { key: 'cambotado', label: 'Cambotado' },
                { key: 'ripado', label: 'Ripado' },
                { key: 'paginado', label: 'Paginado' },
                { key: 'aparente', label: 'Aparente' },
                { key: 'needsGarfo', label: 'Necessita Garfo' },
                { key: 'needsGastalho', label: 'Necessita Gastalho' },
                { key: 'garfo', label: 'Garfo' },
                { key: 'gastalho', label: 'Gastalho' },
                { key: 'fundoDeViga', label: 'Fundo de Viga' },
              ]
                .filter(({ key }) =>
                  (
                    modifierFieldsByType[
                      newProduct.typeOnQuote as keyof typeof modifierFieldsByType
                    ] ?? []
                  ).includes(key),
                )
                .map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={modifiers[key as keyof typeof modifiers]}
                      onChange={e =>
                        updateModifier(
                          key as keyof NonNullable<Product['modifiers']>,
                          e.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelClass}>I.C. Chapa</label>
            <LocalDecimalInput
              ref={icChapa1Ref}
              value={consumptionRates.icChapa1}
              onChange={v => updateConsumptionRate('icChapa1', v)}
              onKeyDown={e => handleKeyDown(e, icRipa1Ref)}
              precision={2}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className={labelClass}>I.C. Ripa</label>
            <LocalDecimalInput
              ref={icRipa1Ref}
              value={consumptionRates.icRipa1}
              onChange={v => updateConsumptionRate('icRipa1', v)}
              onKeyDown={e => handleKeyDown(e, icChapa2Ref)}
              precision={4}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className={labelClass}>I.C. Chapa Especial</label>
            <LocalDecimalInput
              ref={icChapa2Ref}
              value={consumptionRates.icChapa2}
              onChange={v => updateConsumptionRate('icChapa2', v)}
              onKeyDown={e => handleKeyDown(e, icRipa2Ref)}
              precision={2}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className={labelClass}>I.C. Ripa Especial</label>
            <LocalDecimalInput
              ref={icRipa2Ref}
              value={consumptionRates.icRipa2}
              onChange={v => updateConsumptionRate('icRipa2', v)}
              onKeyDown={handleLastFieldKeyDown}
              precision={4}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </GenericModal>
  )
}

export default EditProduct
