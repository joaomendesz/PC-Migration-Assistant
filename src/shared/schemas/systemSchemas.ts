import { z } from 'zod'

export const SystemInfoSchema = z.object({
  computerName: z.string().min(1),
  osName: z.string().min(1),
  osVersion: z.string().min(1),
  osBuild: z.string().min(1),
  architecture: z.string().min(1),
  cpu: z.string().min(1),
  memoryGB: z.number().nonnegative(),
})
