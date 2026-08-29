import { Router } from 'express'
import { quotePut } from './put'
import { quoteFixedCostsPut } from './fixedCosts'
import { quoteDocumentPut } from './document'

export const quotePutRouter = Router()

quotePutRouter.put('/', quotePut)
quotePutRouter.put('/fixedCosts', quoteFixedCostsPut)
quotePutRouter.put('/document', quoteDocumentPut)
