import { Router } from 'express'
import { clientGet } from './get'
import { clientPost } from './post'
import { clientDelete } from './delete'

export const clientRouter = Router()

clientRouter.get('/', clientGet)
clientRouter.post('/', clientPost)
clientRouter.delete('/', clientDelete)
