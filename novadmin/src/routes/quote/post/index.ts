import { Router } from 'express'
import { quotePost } from './post'
import { quoteRevisionPost } from './revision'
import { quoteAdditionPost } from './addition'

export const quotePostRouter = Router()

quotePostRouter.post('/', quotePost)
quotePostRouter.post('/revision', quoteRevisionPost)
quotePostRouter.post('/addition', quoteAdditionPost)
