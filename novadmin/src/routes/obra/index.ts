import { Router } from 'express'
import { obraGet } from './get'
import { obraPost } from './post'
import { obraDelete } from './delete'

export const obraRouter = Router()

obraRouter.get('/', obraGet)
obraRouter.post('/', obraPost)
obraRouter.delete('/', obraDelete)
