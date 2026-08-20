import { useState } from 'react'
import { Sidebar } from '@renderer/components/Sidebar'
import { useAppScan } from '@renderer/hooks/useAppScan'
import { useTheme } from '@renderer/hooks/useTheme'
import { CreateSnapshotPage } from '@renderer/pages/CreateSnapshotPage'
import { DashboardPage } from '@renderer/pages/DashboardPage'
import type { PageId } from '@renderer/pages/pageTypes'
import { PlaceholderPage } from '@renderer/pages/PlaceholderPage'
import { ProgramsPage } from '@renderer/pages/ProgramsPage'
import { SettingsPage } from '@renderer/pages/SettingsPage'

export function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const { theme, setTheme } = useTheme()
  const scan = useAppScan()

  const renderPage = (): React.ReactNode => {
    if (activePage === 'dashboard') {
      return (
        <DashboardPage
          scanResult={scan.scanResult}
          onCreateSnapshot={() => setActivePage('create-snapshot')}
          onPrograms={() => setActivePage('programs')}
        />
      )
    }

    if (activePage === 'create-snapshot') {
      return (
        <CreateSnapshotPage
          scanResult={scan.scanResult}
          progress={scan.progress}
          isScanning={scan.isScanning}
          error={scan.error}
          onScan={scan.scanApps}
        />
      )
    }

    if (activePage === 'programs') {
      return (
        <ProgramsPage
          scanResult={scan.scanResult}
          isScanning={scan.isScanning}
          onScan={scan.scanApps}
        />
      )
    }

    if (activePage === 'settings') {
      return <SettingsPage theme={theme} onThemeChange={setTheme} />
    }

    const placeholders: Record<
      Exclude<PageId, 'dashboard' | 'create-snapshot' | 'programs' | 'settings'>,
      { eyebrow: string; title: string; description: string }
    > = {
      snapshots: {
        eyebrow: 'Snapshots',
        title: 'Snapshots',
        description: 'Histórico e importação de arquivos .pcma entram na próxima fase.',
      },
      dev: {
        eyebrow: 'Ambiente',
        title: 'Ambiente Dev',
        description: 'Git, Node.js, Python, Docker, VS Code e extensões serão mapeados depois.',
      },
      files: {
        eyebrow: 'Inventário',
        title: 'Arquivos',
        description: 'Pastas importantes serão inventariadas sem copiar arquivos por padrão.',
      },
      fonts: {
        eyebrow: 'Inventário',
        title: 'Fontes',
        description: 'Fontes instaladas pelo usuário serão registradas em uma etapa futura.',
      },
      startup: {
        eyebrow: 'Windows',
        title: 'Inicialização',
        description:
          'Aplicativos iniciados com o Windows serão listados sem restauração automática.',
      },
      history: {
        eyebrow: 'Logs',
        title: 'Histórico',
        description: 'Sessões de snapshot e restauração serão gravadas localmente.',
      },
    }

    return <PlaceholderPage {...placeholders[activePage]} />
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-950 dark:bg-app-bg dark:text-app-text">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{renderPage()}</div>
      </main>
    </div>
  )
}
