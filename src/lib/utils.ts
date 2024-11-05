import { sign } from "hono/jwt"
import type { JWTPayload } from "hono/utils/jwt/types"

export const dateInSeconds = (seconds: number) => {
  return Math.floor(Date.now() / 1000) + seconds
}


export const handlePromise = <T>(promise: Promise<T>): Promise<[undefined, T] | [Error]> => {
  return promise
    .then(data => [undefined, data] as [undefined, T])
    .catch(error => [error])
}

export const returnError = (message: string) => ({
  success: false,
  error: {
    message,
  }
})

export const returnData = <T>(data: T) => ({
  success: true,
  data,
})

