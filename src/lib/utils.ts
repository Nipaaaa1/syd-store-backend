export const dateInSeconds = (seconds: number) => {
  return Math.floor(Date.now() / 1000) + seconds
}
