import { contextBridge } from 'electron'
import { pcMigrationApi } from './api'

contextBridge.exposeInMainWorld('pcMigration', pcMigrationApi)
