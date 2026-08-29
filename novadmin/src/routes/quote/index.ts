import { Router } from 'express'

import { quoteFixedCostRouter } from './fixedCost'
import { quotePricingOptionRouter } from './pricingOption'
import { quoteElementRouter } from './element'
import { quoteScopeRouter } from './scope'
import { quoteFileRouter } from './file'
import { quoteUnlockRouter } from './unlock'
import { quoteLockRouter } from './lock'
import { quoteGet } from './get'
import { quotePostRouter } from './post'
import { quotePutRouter } from './put'
import { quoteSyncPost } from './sync'
import { quoteImportPost } from './import'
import { quoteDelete } from './delete'

export const quoteRouter = Router()

quoteRouter.get('/', quoteGet)
quoteRouter.use('/', quotePostRouter)
quoteRouter.post('/sync', quoteSyncPost)
quoteRouter.post('/import', quoteImportPost)
quoteRouter.use('/lock', quoteLockRouter)
quoteRouter.use('/unlock', quoteUnlockRouter)
quoteRouter.use('/', quotePutRouter)
quoteRouter.delete('/', quoteDelete)

quoteRouter.use('/fixedCost', quoteFixedCostRouter)
quoteRouter.use('/pricingOption', quotePricingOptionRouter)
quoteRouter.use('/element', quoteElementRouter)
quoteRouter.use('/scope', quoteScopeRouter)
quoteRouter.use('/file', quoteFileRouter)
