import { z } from 'zod'

export const WingetStatusSchema = z.object({
  available: z.boolean(),
  version: z.string().optional(),
  error: z.string().optional(),
})

export const InstalledApplicationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().optional(),
  publisher: z.string().optional(),
  installLocation: z.string().optional(),
  icon: z.string().optional(),
  winget: z
    .object({
      packageId: z.string().min(1),
      source: z.string().optional(),
      version: z.string().optional(),
    })
    .optional(),
  restoreMethod: z.enum(['winget', 'manual', 'unknown']),
})

export const ScanProgressEventSchema = z.object({
  scanner: z.enum(['system', 'registry', 'winget', 'normalization']),
  label: z.string().min(1),
  status: z.enum(['pending', 'running', 'done', 'failed']),
  message: z.string().optional(),
})

export const ScanAppsResultSchema = z.object({
  apps: z.array(InstalledApplicationSchema),
  winget: WingetStatusSchema,
  scannedAt: z.string().datetime(),
  sourceCounts: z.object({
    registry: z.number().int().nonnegative(),
    winget: z.number().int().nonnegative(),
    merged: z.number().int().nonnegative(),
  }),
})
