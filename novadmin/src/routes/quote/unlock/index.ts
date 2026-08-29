import { Router } from 'express'
import { quoteCostsUnlockPost } from './costs'
import { quoteDocumentUnlockPost } from './document'
import { quoteElementsUnlockPost } from './elements'

export const quoteUnlockRouter = Router()

quoteUnlockRouter.post('/costs', quoteCostsUnlockPost)
quoteUnlockRouter.post('/document', quoteDocumentUnlockPost)
quoteUnlockRouter.post('/elements', quoteElementsUnlockPost)
