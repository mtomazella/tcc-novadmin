import { Router } from 'express'
import { quoteElementGet } from './get'
import { quoteElementPost } from './post'
import { quoteElementDelete } from './delete'
import { quoteElementBatchPost } from './postBatch'

export const quoteElementRouter = Router()

quoteElementRouter.get('/', quoteElementGet)
quoteElementRouter.post('/', quoteElementPost)
quoteElementRouter.post('/batch', quoteElementBatchPost)
quoteElementRouter.delete('/', quoteElementDelete)
