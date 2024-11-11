import 'dotenv/config'

import { sign, verify } from "hono/jwt";
import { db } from "../../db/index.js";
import { usersTable } from "../../db/schema.js";
import { dateInSeconds, handlePromise } from "../../lib/utils.js";
import type { insertUser } from "./auth.schema.js";
import { eq } from 'drizzle-orm';

export const registerNewUser = async (data: insertUser) => {
  return await handlePromise(
    db
    .insert(usersTable)
    .values(data)
    .returning()
  )
}

export const createJwtTokens = async (id: string) => {
  const result = await Promise.all([
    sign({
      sub: id,
      exp: dateInSeconds(60 * 15)
    }, process.env.JWT_ACCESS_TOKEN_SECRET as string),
    sign({
      sub:id,
      exp: dateInSeconds(60 * 60 * 24 * 30)
    }, process.env.JWT_REFRESH_TOKEN_SECRET as string)
  ])
  return [ result[0], result[1] ]
}

export const getUserFromEmail = async (email: string) => {
  return await handlePromise(
    db
    .select()
    .from(usersTable)
    .where(
        eq(usersTable.email, email)
    )
  )
}

export const generateNewAccessToken = async (refreshToken: string) => {
  const { sub: subject } = await verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET as string)

  return handlePromise(createJwtTokens(subject as string))
}
