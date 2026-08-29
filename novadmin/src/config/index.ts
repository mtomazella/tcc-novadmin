import * as dotenv from 'dotenv'

dotenv.config({ path: process.env.ENV_FILE })

interface Config {
    port: number
    nodeEnv: string
    postgres: {
        user: string
        password: string
        host: string
        port: number
        database: string
    }
    auth: {
        jwtSecret: string
        jwtExpirationSeconds: string
        refreshTokenExpirationSeconds: string
        refreshTokenTimeNotCreateNewSeconds: string
    }
    lockTimeoutSeconds: string
    features: {
        includeElementIndex: {
            ignoreForProductCodes: string[]
            ignoreTagForAggregation: string[]
        }
        itemSorting: {
            applySizeSortingForProductCodes: string[]
        }
    }
}

if (!process.env.POSTGRES_PASSWORD) {
    throw new Error('POSTGRES_PASSWORD environment variable is required')
}

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required')
}

const config: Config = {
    port: Number(process.env.PORT) ?? 3000,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    postgres: {
        user: process.env.POSTGRES_USER ?? 'novadmin',
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_HOST ?? 'localhost',
        port: Number(process.env.POSTGRES_PORT) ?? 5432,
        database: process.env.POSTGRES_DB ?? 'novadmin',
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpirationSeconds: process.env.JWT_EXPIRATION_SEC ?? '3600', // 1 hour
        refreshTokenExpirationSeconds:
            process.env.REFRESH_TOKEN_EXPIRATION_SEC ?? '604800', // 7 days
        refreshTokenTimeNotCreateNewSeconds:
            process.env.REFRESH_TOKEN_TIME_NOT_CREATE_NEW_SEC ?? '3600', // 1 hour
    },
    lockTimeoutSeconds: process.env.LOCK_TIMEOUT_SEC ?? '600', // 10 minutes
    features: {
        includeElementIndex: {
            ignoreForProductCodes: ['LAJ', 'FXR', 'LJR', 'LJRP', 'ABA'],
            ignoreTagForAggregation: ['NOTA'],
        },
        itemSorting: {
            applySizeSortingForProductCodes: [
                'LAJ',
                'FXR',
                'LJR',
                'LJRP',
                'ABA',
            ],
        },
    },
}

export default config
