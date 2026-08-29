import { Router } from 'express'
import { supplierGet } from './get'
import { supplierPost } from './post'
import { supplierDelete } from './delete'

export const supplierRouter = Router()

supplierRouter.get('/', supplierGet)
supplierRouter.post('/', supplierPost)
supplierRouter.delete('/', supplierDelete)
