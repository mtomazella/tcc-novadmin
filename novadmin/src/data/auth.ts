import { createPostgresClient } from '.'
import { compareSync } from 'bcrypt'

export const getLoginUser = async ({
    username,
    password,
}: {
    username: string
    password: string
}) => {
    const sql = createPostgresClient()

    const user = await sql<{ id: number; password: string }[]>`
        SELECT id, password FROM "user"
        WHERE email = ${username}
        AND deletedAt IS NULL
    `

    if (compareSync(password, user[0]?.password || '')) {
        return user[0].id
    }
}
