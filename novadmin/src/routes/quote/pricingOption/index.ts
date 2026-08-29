import { Router } from 'express'
import { quotePricingOptionGet } from './get'
import { quotePricingOptionPost } from './post'
import { quotePricingOptionBatchPost } from './postBatch'
import { quotePricingOptionDelete } from './delete'

export const quotePricingOptionRouter = Router()

quotePricingOptionRouter.get('/', quotePricingOptionGet)
quotePricingOptionRouter.post('/', quotePricingOptionPost)
quotePricingOptionRouter.post('/batch', quotePricingOptionBatchPost)
quotePricingOptionRouter.delete('/', quotePricingOptionDelete)
