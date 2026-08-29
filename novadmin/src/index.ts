import express from 'express'
import cors from 'cors'

import config from './config'
import { router } from './routes'
import { systemLogger } from 'config/logger'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use((req, res, next) => {
    systemLogger.info(
        `Request: ${req.host} ${req.method} ${req.url} - Body: ${JSON.stringify(req.body)} - ${req.headers.authorization}`
    )
    next()
})

app.use(router)

app.listen(config.port, '0.0.0.0', () => {
    console.log(`Server is running on port ${config.port}`)
    console.log(process.env.ENV_FILE)
})
