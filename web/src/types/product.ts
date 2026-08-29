export type ProductType = 'pilar' | 'viga' | 'laje' | 'outro'

export type Product = {
  id: string
  name: string
  shorthand: string
  description?: string
  typeOnQuote?: ProductType
  commercialPercentage: number | null
  projectPercentage: number | null
  modifiers?: {
    cambotado: boolean
    gastalho: boolean
    ripado: boolean
    aparente: boolean
    paginado: boolean
    garfo: boolean
    needsGarfo: boolean
    needsGastalho: boolean
    fundoDeViga: boolean
  }
  consumptionRates?: {
    icChapa1: number | null
    icChapa2: number | null
    icChapa3: number | null
    icRipa1: number | null
    icRipa2: number | null
    icRipa3: number | null
  }
}

export const defaultProductModifiers: NonNullable<Product['modifiers']> = {
  cambotado: false,
  gastalho: false,
  ripado: false,
  aparente: false,
  paginado: false,
  garfo: false,
  needsGarfo: false,
  needsGastalho: false,
  fundoDeViga: false,
}

export const defaultProductConsumptionRates: NonNullable<
  Product['consumptionRates']
> = {
  icChapa1: null,
  icChapa2: null,
  icChapa3: null,
  icRipa1: null,
  icRipa2: null,
  icRipa3: null,
}

export type ProductParams = {
  generalFuzzyValue?: string
  page?: number
  limit?: number
  order?: any
}

export type ProductResponse = {
  count: { page: number; total: number }
  data: Product[]
  meta: {
    page: number
    limit: number
    totalPages: number
  }
}
