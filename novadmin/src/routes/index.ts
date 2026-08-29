import { Router } from 'express'
import { clientRouter } from './client'
import { login } from './login'
import { profileRouter } from './profile'
import { accountRouter } from './account'
import { authMiddleware } from 'middleware/auth'
import { productRouter } from './product'
import { obraRouter } from './obra'
import { userRouter } from './user'
import { refresh } from './refresh'
import { materialRouter } from './material'
import { supplierRouter } from './supplier'
import { quoteRouter } from './quote'

export const router = Router()

router.get('/', (req, res) => {
    res.json({ message: 'Hello World' })
})

router.post('/login', login)
router.post('/refresh', refresh)

const privateRouter = Router()
privateRouter.use(authMiddleware)
router.use(privateRouter)

privateRouter.use('/client', clientRouter)
privateRouter.use('/product', productRouter)
privateRouter.use('/obra', obraRouter)
privateRouter.use('/user', userRouter)
privateRouter.use('/material', materialRouter)
privateRouter.use('/supplier', supplierRouter)
privateRouter.use('/quote', quoteRouter)
privateRouter.use('/profile', profileRouter)
privateRouter.use('/account', accountRouter)
