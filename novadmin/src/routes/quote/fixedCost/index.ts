import { Router } from 'express'
import { quoteFixedCostGet } from './get'
import { quoteFixedCostPost } from './post'
import { quoteFixedCostBatchPost } from './postBatch'

export const quoteFixedCostRouter = Router()

quoteFixedCostRouter.get('/', quoteFixedCostGet)
quoteFixedCostRouter.post('/', quoteFixedCostPost)
quoteFixedCostRouter.post('/batch', quoteFixedCostBatchPost)
