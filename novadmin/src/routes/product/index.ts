import { Router } from 'express'
import { productGet } from './get'
import { productPost } from './post'
import { productDelete } from './delete'

export const productRouter = Router()

productRouter.get('/', productGet)
productRouter.post('/', productPost)
productRouter.delete('/', productDelete)
