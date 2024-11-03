import { z } from "zod";

export const addItemSchema = z.object({
  name: z.string().min(1).max(50),
  quantity: z.number().min(0),
  tags: z.string().max(50)
})

export type addItemType = z.infer<typeof addItemSchema>
