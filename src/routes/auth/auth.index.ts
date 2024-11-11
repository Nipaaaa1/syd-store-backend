import { Hono } from "hono";
import { insertUser } from "../../lib/validator/auth-validator.js";
import { db } from "../../db/index.js";
import { refreshTokenTable, usersTable } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { hash, verify } from '@node-rs/argon2'
import { dateInSeconds, handlePromise, returnData, returnError } from "../../lib/utils.js";
import { sign, verify as jwtVerify } from "hono/jwt";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";

const auth = new Hono()

// Register Route

auth.post('/register', zValidator('json', insertUser), async (c) => {
  const data = c.req.valid('json')

  const [ checkDbError, checkDbData ] = await handlePromise(db.select({
    email: usersTable.email
  }).from(usersTable).where(eq(usersTable.email, data.email)))

  if(checkDbError) {
    return c.json(returnError(checkDbError.message))
  }

  if(checkDbData.length > 0 ) {
    return c.json(returnError('Email is used'))
  }

  const [ hashedPasswordError, hashedPasswordData ] = await handlePromise(hash(data.password, {
    parallelism: 1
  }))

  if(hashedPasswordError) return c.json(returnError(hashedPasswordError.message))

  const [ registeredUserError, registeredUserData ] = await handlePromise(db.insert(usersTable).values({
    name: data.name,
    email: data.email,
    password: hashedPasswordData
  }).returning({
    userId: usersTable.id,
    userEmail: usersTable.email
  }))

  if(registeredUserError) {
    return c.json(returnError(registeredUserError.message))
  }

  const accessPayload = {
    sub: registeredUserData[0].userId,
    email: registeredUserData[0].userEmail,
    exp: dateInSeconds(60 * 15) 
  }

  const refreshPayload = {
    sub: registeredUserData[0].userId,
    exp: dateInSeconds(60 * 60 * 24 * 30)
  }

  const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET, AUTH_DOMAIN_URL } = env(c)

  const [ accessTokenError, accessTokenData ] = await handlePromise(sign(accessPayload, JWT_ACCESS_TOKEN_SECRET as string))

  const [ refreshTokenError, refreshTokenData ] = await handlePromise(sign(refreshPayload, JWT_REFRESH_TOKEN_SECRET as string))

  if(accessTokenError) {
    return c.json(returnError(accessTokenError.message))
  }

  if(refreshTokenError) {
    return c.json(returnError(refreshTokenError.message))
  }


  await db.insert(refreshTokenTable).values({
    owner_id: registeredUserData[0].userId,
    token: refreshTokenData
  })

  setCookie(c, 'refresh_token', refreshTokenData, {
    httpOnly: true,
    domain: AUTH_DOMAIN_URL as string,
    path: '/auth/refresh'
  })

  return c.json(returnData({ accessToken: accessTokenData }))
})

// Login route

auth.post('/login', zValidator('json', insertUser.omit({ name: true })), async (c) => {
  const data = c.req.valid('json')

  const userData = await db.select({
    userId: usersTable.id,
    email: usersTable.email,
    passwordHash: usersTable.password
  }).from(usersTable).where(eq(usersTable.email, data.email))

  if(userData.length == 0) {
    return c.json({
      success: false,
      error: {
        message: "Email not found"
      }
    })
  }

  const isPasswordVerified = await verify(userData[0].passwordHash, data.password, {
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

  await db.insert(refreshTokenTable).values({
    token: refreshToken,
    owner_id: userData[0].userId
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

auth.delete('/logout', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token') as string

  const dbToken = await db.delete(refreshTokenTable).where(eq(refreshTokenTable.token, refreshToken)).returning({
    token: refreshTokenTable.token
  })

  if(dbToken.length == 0) {
    return c.json({
      success: false,
      error: {
        message: 'Token not found'
      }
    })
  }

  return c.json({
    success: true,
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
