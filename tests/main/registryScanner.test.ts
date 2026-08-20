import { describe, expect, it } from 'vitest'
import { RegistryScanner } from '@main/scanners/registryScanner'

describe('RegistryScanner', () => {
  it('parses uninstall registry output and filters system updates', () => {
    const output = `
HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Chrome
    DisplayName    REG_SZ    Google Chrome
    DisplayVersion    REG_SZ    126.0.0
    Publisher    REG_SZ    Google LLC
    InstallLocation    REG_SZ    C:\\Program Files\\Google\\Chrome
    DisplayIcon    REG_SZ    C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
    UninstallString    REG_SZ    "C:\\Program Files\\Google\\Chrome\\Application\\setup.exe" --uninstall

HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KB5034123
    DisplayName    REG_SZ    Security Update for Microsoft Windows (KB5034123)
    ReleaseType    REG_SZ    Security Update
`

    const apps = new RegistryScanner().parseRegistryOutput(
      output,
      'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    )

    expect(apps).toEqual([
      {
        name: 'Google Chrome',
        version: '126.0.0',
        publisher: 'Google LLC',
        installLocation: 'C:\\Program Files\\Google\\Chrome',
        icon: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        uninstallString: '"C:\\Program Files\\Google\\Chrome\\Application\\setup.exe" --uninstall',
        registryKey:
          'HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Chrome',
        registryRoot: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      },
    ])
  })
})
