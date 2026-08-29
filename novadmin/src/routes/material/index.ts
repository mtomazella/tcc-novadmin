import { Router } from 'express'
import { materialGet } from './get'
import { materialPost } from './post'
import { materialDelete } from './delete'
import { materialBatchPost } from './postBatch'

export const materialRouter = Router()

materialRouter.get('/', materialGet)
materialRouter.post('/', materialPost)
materialRouter.post('/batch', materialBatchPost)
materialRouter.delete('/', materialDelete)
