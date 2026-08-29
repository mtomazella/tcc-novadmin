import { Router } from 'express'
import { quoteFileGet } from './get'
import { quoteFilePost } from './post'
import { quoteFileDelete } from './delete'

export const quoteFileRouter = Router()

quoteFileRouter.get('/', quoteFileGet)
quoteFileRouter.post('/', quoteFilePost)
quoteFileRouter.delete('/', quoteFileDelete)
