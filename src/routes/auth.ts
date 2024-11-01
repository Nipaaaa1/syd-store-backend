import { Hono } from "hono";
import { loginSchema, registerSchema } from "../lib/validator/auth-validator.js";
import { db } from "../db/index.js";
import { refreshTokenTable, usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hash, verify } from '@node-rs/argon2'
import { dateInSeconds } from "../lib/utils.js";
import { sign, verify as jwtVerify } from "hono/jwt";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { access } from "fs";

const auth = new Hono()

// Register Route

auth.post('/register', async (c) => {
  const data = await c.req.json()

  const validatedData = registerSchema.safeParse(data)
  if(!validatedData.success) {
    return c.json(validatedData.error.format())
  }

  const checkDb = await db.select({
    email: usersTable.email
  }).from(usersTable).where(eq(usersTable.email, validatedData.data.email))
  if(checkDb.length > 0) {
    return c.json({
      error: "Email already exists!"
    })
  }

  const hashedPassword = await hash(validatedData.data.password, {
    parallelism: 1
  })

  const userData = await db.insert(usersTable).values({
    name: validatedData.data.name,
    email: validatedData.data.email,
    password_hash: hashedPassword
  }).returning({
    userId: usersTable.id,
    userEmail: usersTable.email
  })

  const accessPayload = {
    sub: userData[0].userId,
    email: userData[0].userEmail,
    exp: dateInSeconds(60 * 15) 
  }

  const refreshPayload = {
    sub: userData[0].userId,
    exp: dateInSeconds(60 * 60 * 24 * 30)
  }

  const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } = env(c)

  const accessToken = await sign(accessPayload, JWT_ACCESS_TOKEN_SECRET as string)
  
  const refreshToken = await sign(refreshPayload, JWT_REFRESH_TOKEN_SECRET as string)

  await db.insert(refreshTokenTable).values({
    owner_id: userData[0].userId,
    token: refreshToken
  })

  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: true
  })

  return c.json({
    success: true,
    data: {
      accessToken,
    }
  })
})

// Login route

auth.post('/login', async (c) => {
  const data = await c.req.json()

  const validatedData = loginSchema.safeParse(data)

  if(!validatedData.success) {
    return c.json(validatedData.error.format())
  }

  const userData = await db.select({
    userId: usersTable.id,
    email: usersTable.email,
    passwordHash: usersTable.password_hash
  }).from(usersTable).where(eq(usersTable.email, validatedData.data.email))

  if(userData.length == 0) {
    return c.json({
      success: false,
      error: {
        message: "Email not found"
      }
    })
  }

  const isPasswordVerified = await verify(userData[0].passwordHash, validatedData.data.password, {
    parallelism: 1
  })

  if(!isPasswordVerified) {
    return c.json({
      success: false,
      error: {
        message: "Wrong Password"
      }
    })
  }

  const accessPayload = {
    sub: userData[0].userId,
    email: userData[0].email,
    exp: dateInSeconds(60 * 15)
  }

  const refreshPayload = {
    sub: userData[0].userId,
    exp: dateInSeconds(60 * 60 * 24 * 30)
  }

  const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } = env(c)

  const accessToken = await sign(accessPayload, JWT_ACCESS_TOKEN_SECRET as string)
  const refreshToken = await sign(refreshPayload, JWT_REFRESH_TOKEN_SECRET as string)

  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: true
  })

  return c.json({
    success: true,
    data: {
      accessToken,
    }
  })

})

// Refresm token
auth.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token') as string

  const { JWT_REFRESH_TOKEN_SECRET, JWT_ACCESS_TOKEN_SECRET } = env(c)

  const dbToken = await db.select({
    token: refreshTokenTable.token,
    owner: {
      email: usersTable.email
    }
  }).from(refreshTokenTable).where(eq(refreshTokenTable.token, refreshToken)).leftJoin(usersTable, eq(refreshTokenTable.owner_id, usersTable.id))

  if(dbToken.length == 0) {
    return c.json({
      success: false,
      error: {
        message: "Refresh token not found"
      }
    })
  }
  
  const verifiedToken = await jwtVerify(refreshToken, JWT_REFRESH_TOKEN_SECRET as string)
  
  const accessPayload = {
    sub: verifiedToken.sub,
    email: dbToken[0].owner?.email,
    exp: dateInSeconds(60 * 15)
  }

  const accessToken = await sign(accessPayload, JWT_ACCESS_TOKEN_SECRET as string)


  return c.json({
    success: true,
    data: {
      accessToken,
    }
  })

})

export default auth
