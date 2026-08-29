import bcrypt from 'bcryptjs'
import { createPostgresClient } from '..'

export const getLoginUser = async ({
    username,
    password,
}: {
    username: string
    password: string
}): Promise<number | null> => {
    const sql = createPostgresClient()

    try {
        const [user] = await sql<{ id: number; password: string }[]>`
            SELECT id, password
            FROM "user"
            WHERE name = ${username}
                AND deletedAt IS NULL
            LIMIT 1;
        `

        if (!user) {
            return null
        }

        const passwordMatches = await bcrypt.compare(password, user.password)

        if (!passwordMatches) {
            return null
        }

        return user.id
    } finally {
        await sql.end()
    }
}
