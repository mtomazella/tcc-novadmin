export interface FixedCost {
  id: string
  name: string
  description: string
  value: number
  valueType: 'price' | 'percentage'
  created_at?: string
  updated_at?: string
}

export interface PricingOption {
  id: string
  name: string
  valueReto: number
  valueCambotado: number
  valueGarfo: number
  created_at?: string
  updated_at?: string
}

export interface FixedCostParams {
  limit?: number
  page?: number
  generalFuzzyValue?: string
  generalFuzzyFields?: string[]
  order?: string
  activationStatus?: string
}

export interface PricingOptionParams {
  limit?: number
  page?: number
  generalFuzzyValue?: string
  generalFuzzyFields?: string[]
  order?: string
  activationStatus?: string
}

export interface FixedCostResponse {
  data: FixedCost[]
  count: { total: number; page: number }
  meta: FixedCostParams
}

export interface PricingOptionResponse {
  data: PricingOption[]
  count: { total: number; page: number }
  meta: PricingOptionParams
}

export interface BatchUpsertFixedCostBody {
  records: {
    id?: string
    name: string
    description: string
    value: number
    valueType: 'price' | 'percentage'
  }[]
}

export interface BatchUpsertPricingOptionBody {
  records: {
    id?: string
    name: string
    valueReto: number
    valueCambotado: number
    valueGarfo: number
  }[]
}
