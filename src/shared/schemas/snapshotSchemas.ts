import { z } from 'zod'
import { InstalledApplicationSchema, WingetStatusSchema } from './appSchemas'
import { SystemInfoSchema } from './systemSchemas'

export const SnapshotChecksumSchema = z.object({
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sizeBytes: z.number().int().nonnegative(),
})

export const SnapshotManifestSchema = z.object({
  format: z.literal('pcma'),
  schemaVersion: z.literal(1),
  appVersion: z.string().min(1),
  createdAt: z.string().datetime(),
  computer: z.object({
    name: z.string().min(1),
  }),
  contents: z.object({
    applications: z.boolean(),
    developerEnvironment: z.boolean(),
    vscode: z.boolean(),
    fonts: z.boolean(),
    startup: z.boolean(),
    environment: z.boolean(),
    files: z.boolean(),
  }),
  checksums: z.record(SnapshotChecksumSchema),
})

export const SnapshotArchiveInputSchema = z.object({
  appVersion: z.string().min(1),
  createdAt: z.string().datetime(),
  system: SystemInfoSchema,
  applications: z.array(InstalledApplicationSchema).min(1),
  winget: WingetStatusSchema,
})

export const CreateSnapshotPayloadSchema = z.object({
  applications: z.array(InstalledApplicationSchema).min(1),
  winget: WingetStatusSchema,
})

export const CreateSnapshotResultSchema = z.object({
  cancelled: z.boolean(),
  filePath: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  manifest: SnapshotManifestSchema.optional(),
})
