import { Hono } from "hono";
import { insertUser } from "../../lib/validator/auth-validator.js";
import { hash, verify } from '@node-rs/argon2'
import { handlePromise, returnData, returnError } from "../../lib/utils.js";
import { env } from "hono/adapter";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { createJwtTokens, generateNewAccessToken, getUserFromEmail, registerNewUser } from "./auth.utils.js";

const auth = new Hono()

auth.post('/register', zValidator('json', insertUser), async (c) => {
  const { name, email, password} = c.req.valid('json')
  const { AUTH_DOMAIN_URL } = env(c)

  const [ hashedPasswordError, hashedPasswordData ] = await handlePromise(hash(password, {
    parallelism: 1
  }))

  if(hashedPasswordError) return c.json(returnError(hashedPasswordError.message))

  const [ newUserError, newUserData ] = await registerNewUser({
    name: name,
    email: email,
    password: hashedPasswordData
  })

  if(newUserError) return c.json(returnError(newUserError.message))

  const [ accessToken, refreshToken ] = await createJwtTokens(newUserData[0].id)
 
  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    domain: AUTH_DOMAIN_URL as string,
    path: '/auth/refresh'
  })

  return c.json(returnData({ accessToken }))
})

auth.post('/login', zValidator('json', insertUser.omit({ name: true })), async (c) => {
  const { email, password } = c.req.valid('json')
  const { AUTH_DOMAIN_URL } = env(c)

  const [ userError, userData ] = await getUserFromEmail(email)

  if(userError) return c.json(returnError(userError.message))
   
  const isPasswordVerified = await verify(userData[0].password, password, {
    parallelism: 1
  })

  if(!isPasswordVerified) return c.json(returnError('Wrong Password'))

  const [ accessToken, refreshToken ] = await createJwtTokens(userData[0].id)

  
  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    domain: AUTH_DOMAIN_URL as string,
    path: '/auth/refresh'
  })

  return c.json(returnData({ accessToken }))
})

auth.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token') as string
  
  const [ error, data ] = await generateNewAccessToken(refreshToken)
  
  if(error) return c.json(returnError(error.message))

  return c.json(returnData({
    accessToken: data[0]
  }))
})

export default auth
