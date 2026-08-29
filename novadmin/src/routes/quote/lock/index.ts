import { Router } from 'express'
import { quoteCostsLockPost } from './costs'
import { quoteDocumentLockPost } from './document'
import { quoteElementsLockPost } from './elements'

export const quoteLockRouter = Router()

quoteLockRouter.post('/costs', quoteCostsLockPost)
quoteLockRouter.post('/document', quoteDocumentLockPost)
quoteLockRouter.post('/elements', quoteElementsLockPost)
