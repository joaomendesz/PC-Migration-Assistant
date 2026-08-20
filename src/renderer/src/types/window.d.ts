import type { PcMigrationApi } from '@shared/types/api'

declare global {
  interface Window {
    pcMigration: PcMigrationApi
  }
}

export {}
