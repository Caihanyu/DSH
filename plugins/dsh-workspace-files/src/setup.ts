/**
 * `dsh-workspace-files` setup state and desktop-application discovery: which
 * applications this plugin may drive, where their executables live, and how the
 * user answered the first-run question. The state is one JSON file under the
 * Harness home, so the behaviour is reconstructible from disk and survives a
 * profile reinstall. Discovery is the host's own concern: it probes the
 * registry, PATH, well-known install locations, and — only when asked — walks
 * the fixed drives for the executable names.
 * @module @deepseek-ai/dsh-workspace-files/setup
 */

import { access, mkdir, opendir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { runNativeCommand } from '@deepseek-ai/dsh-native-command'

/** Application slot a configured executable fills. */
export type AppSlot = 'markdown' | 'code' | 'office'

/** One configured application, as the wizard left it. */
export interface AppEntry {
  /** Candidate identity (`typora`, `marktext`, `wps`, `vscode`). */
  id: string
  /** Display name shown in the tree labels. */
  label: string
  /** Absolute path (or PATH name) the opener runs. */
  command: string
  /** Whether the user allowed this plugin to use it. */
  enabled: boolean
}

/** How the whole feature was decided on this machine. */
export type SetupStatus = 'pending' | 'ready' | 'off'

/** Persisted setup state (one file, `workspace-files/config.json`). */
export interface SetupState {
  version: 1
  /** `pending` = never answered; `ready` = configured; `off` = user declined. */
  status: SetupStatus
  /** Configured applications by slot; a missing slot has no opener. */
  apps: Partial<Record<AppSlot, AppEntry>>
}

/** One application discovery result. */
export interface FoundApp {
  /** Candidate identity (`typora`, `marktext`, `wps`, `vscode`). */
  id: string
  /** Slot this application would fill. */
  slot: AppSlot
  /** Display name. */
  label: string
  /** Absolute executable path. */
  command: string
  /** How it was found, for the wizard's provenance line. */
  source: 'config' | 'location' | 'path' | 'registry' | 'scan'
}

/** Outcome of one discovery pass. */
export interface ScanResult {
  /** Applications this pass resolved. */
  found: FoundApp[]
  /** Filenames the deep pass gave up on before its caps (empty = complete). */
  truncated: string
}

/** One discoverable application. */
interface Candidate {
  /** Stable id used on the wire and inside the state file. */
  id: string
  /** Slot this application fills. */
  slot: AppSlot
  /** Display name. */
  label: string
  /** Lower-case executable filename the deep scan looks for. */
  exeName: string
  /** PATH names probed before anything else (with and without `.exe`). */
  pathNames: string[]
  /** Registry display-name pattern (`DisplayName`, `App Paths` key name). */
  registry: RegExp
  /** Optional install-location guard, keeping a deep-scan hit plausible. */
  validate?: (directory: string) => boolean
}

/** Directory-name skip list for the deep pass (case-insensitive). */
const SKIP_DIRECTORIES = new Set([
  'windows', 'winsxs', 'windowsapps', 'system volume information', '$recycle.bin',
  'recovery', 'perflogs', 'node_modules', '.git', '.pnpm', '.cache', '.vscode',
  'temp', 'tmp', 'packages', 'installer', 'windows.old', '$windows.~ws', '$windows.~bt',
  'driverstore', 'assembly', 'servicing', 'softwaredistribution',
])

/** Drive roots the deep pass walks, most likely first. */
function driveRoots(): string[] {
  if (process.platform !== 'win32') return ['/']
  const roots: string[] = []
  for (const letter of 'CDEFGHIJKL'.split('')) roots.push(`${letter}:\\`)
  return roots
}

/** Whether a path exists (any failure = no). */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/** The Harness home: `$DSH_HOME` when set, else `~/.dsh`. */
export function harnessHome(): string {
  const configured = process.env.DSH_HOME
  if (typeof configured === 'string' && configured.trim() !== '') return configured.trim()
  return join(homedir(), '.dsh')
}

/** Absolute path of this plugin's state file. */
export function stateFilePath(): string {
  return join(harnessHome(), 'workspace-files', 'config.json')
}

/** Read the persisted state; an unreadable or malformed file reads as `pending`. */
export async function loadState(): Promise<SetupState> {
  try {
    const raw = await readFile(stateFilePath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<SetupState>
    const status = parsed.status
    if (status !== 'pending' && status !== 'ready' && status !== 'off') return freshState()
    return { version: 1, status, apps: parseApps(parsed.apps) }
  } catch {
    return freshState()
  }
}

/** The state of a machine that has never answered the first-run question. */
export function freshState(): SetupState {
  return { version: 1, status: 'pending', apps: {} }
}

/** Keep only well-formed slots from a parsed state file. */
function parseApps(input: unknown): Partial<Record<AppSlot, AppEntry>> {
  const apps: Partial<Record<AppSlot, AppEntry>> = {}
  if (typeof input !== 'object' || input === null) return apps
  for (const slot of ['markdown', 'code', 'office'] as const) {
    const raw = (input as Record<string, unknown>)[slot]
    if (typeof raw !== 'object' || raw === null) continue
    const entry = raw as Record<string, unknown>
    if (typeof entry.id !== 'string' || typeof entry.label !== 'string'
      || typeof entry.command !== 'string' || entry.command.length === 0) continue
    apps[slot] = { id: entry.id, label: entry.label, command: entry.command, enabled: entry.enabled === true }
  }
  return apps
}

/** Write the state file, creating its directory when needed. */
export async function saveState(state: SetupState): Promise<void> {
  const file = stateFilePath()
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

/** Every application this plugin knows how to find. */
const CANDIDATES: readonly Candidate[] = [
  {
    id: 'typora',
    slot: 'markdown',
    label: 'Typora',
    exeName: 'typora.exe',
    pathNames: ['typora'],
    registry: /typora/i,
  },
  {
    id: 'marktext',
    slot: 'markdown',
    label: 'MarkText',
    exeName: 'marktext.exe',
    pathNames: ['marktext'],
    registry: /marktext/i,
  },
  {
    id: 'vscode',
    slot: 'code',
    label: 'VS Code',
    exeName: 'code.exe',
    pathNames: ['code'],
    registry: /visual studio code|vscode|vs code/i,
    validate: directory => /visual studio code|vscode|vs ?code/i.test(directory),
  },
  {
    id: 'wps',
    slot: 'office',
    label: 'WPS Office',
    exeName: 'wps.exe',
    pathNames: ['wps'],
    registry: /wps office|kingsoft|金山/i,
    validate: directory => /office6|kingsoft|wps/i.test(directory),
  },
]

/** Static install locations of one candidate, most specific first. */
function staticLocations(candidate: Candidate): string[] {
  const home = process.env.USERPROFILE ?? homedir()
  const local = process.env.LOCALAPPDATA ?? join(home, 'AppData', 'Local')
  const programFiles = process.env.ProgramFiles ?? 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
  const paths: string[] = []
  if (candidate.id === 'typora') {
    paths.push(
      join(local, 'Programs', 'Typora', 'Typora.exe'),
      join(programFiles, 'Typora', 'Typora.exe'),
      join(programFilesX86, 'Typora', 'Typora.exe'),
      join(home, 'scoop', 'apps', 'typora', 'current', 'Typora.exe'),
    )
  } else if (candidate.id === 'marktext') {
    paths.push(
      join(local, 'Programs', 'marktext', 'MarkText.exe'),
      join(local, 'Programs', 'MarkText', 'MarkText.exe'),
      join(programFiles, 'MarkText', 'MarkText.exe'),
      join(programFilesX86, 'MarkText', 'MarkText.exe'),
      join(home, 'scoop', 'apps', 'marktext', 'current', 'MarkText.exe'),
    )
  } else if (candidate.id === 'vscode') {
    paths.push(
      join(local, 'Programs', 'Microsoft VS Code', 'Code.exe'),
      join(programFiles, 'Microsoft VS Code', 'Code.exe'),
      join(programFilesX86, 'Microsoft VS Code', 'Code.exe'),
      join(home, 'scoop', 'apps', 'vscode', 'current', 'Code.exe'),
    )
  } else {
    paths.push(
      join(local, 'Kingsoft', 'WPS Office'),
      join(programFiles, 'Kingsoft', 'WPS Office'),
      join(programFilesX86, 'Kingsoft', 'WPS Office'),
      join(local, 'Kingsoft', 'WPSOffice'),
    )
  }
  if (process.platform === 'win32') {
    for (const root of driveRoots()) {
      if (candidate.id === 'typora') paths.push(join(root, 'Typora', 'Typora', 'Typora.exe'), join(root, 'Typora', 'Typora.exe'))
      else if (candidate.id === 'marktext') paths.push(join(root, 'MarkText', 'MarkText.exe'), join(root, 'MarkText', 'MarkText-x64.exe'))
      else if (candidate.id === 'vscode') paths.push(join(root, 'Microsoft VS Code', 'Code.exe'), join(root, 'VSCode', 'Code.exe'), join(root, 'Program Files', 'Microsoft VS Code', 'Code.exe'))
      else paths.push(join(root, 'WPS Office'), join(root, 'Kingsoft', 'WPS Office'))
    }
  }
  return paths
}

/**
 * Resolve a version directory holding `office6\wps.exe`, the layout every WPS
 * installer uses (`%LOCALAPPDATA%\Kingsoft\WPS Office\12.1.0.xxx\office6`).
 * @param root - a `Kingsoft\WPS Office` directory.
 * @returns the resolved executable, or undefined.
 */
async function resolveWpsVersionRoot(root: string): Promise<string | undefined> {
  try {
    const handle = await opendir(root)
    for await (const entry of handle) {
      if (!entry.isDirectory()) continue
      const candidate = join(root, entry.name, 'office6', 'wps.exe')
      if (await pathExists(candidate)) return candidate
    }
  } catch {
    return undefined
  }
  return undefined
}

/** One registry row the probe returns. */
interface RegistryRow {
  /** Display name (uninstall entry) or executable key name (App Paths). */
  name: string
  /** `InstallLocation` or the App Paths default value. */
  target: string
  /** `DisplayIcon`, which usually names the executable. */
  icon: string
}

/** PowerShell probe reading both uninstall entries and `App Paths` keys. */
const REGISTRY_PROBE = [
  '$out = @()',
  "$keys = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',",
  "  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',",
  "  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')",
  'foreach ($k in $keys) {',
  '  Get-ItemProperty $k -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName } | ForEach-Object {',
  "    $out += [pscustomobject]@{ name = $_.DisplayName; target = $_.InstallLocation; icon = $_.DisplayIcon }",
  '  }',
  '}',
  "$paths = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths', 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths')",
  'foreach ($p in $paths) {',
  '  Get-ChildItem $p -ErrorAction SilentlyContinue | ForEach-Object {',
  "    $value = (Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue).'(default)'",
  '    if ($value) { $out += [pscustomobject]@{ name = $_.PSChildName; target = $value; icon = "" } }',
  '  }',
  '}',
  'ConvertTo-Json -InputObject $out -Compress -Depth 3',
].join('; ')

/** Read the registry rows; an unavailable probe reads as no rows. */
async function readRegistry(signal: AbortSignal): Promise<RegistryRow[]> {
  if (process.platform !== 'win32') return []
  try {
    const result = await runNativeCommand('powershell.exe', ['-NoProfile', '-Command', REGISTRY_PROBE], signal)
    const text = (result.stdout ?? '').trim()
    if (text === '') return []
    const parsed = JSON.parse(text) as RegistryRow | RegistryRow[]
    const rows = Array.isArray(parsed) ? parsed : [parsed]
    return rows.filter(row => typeof row?.name === 'string')
  } catch {
    return []
  }
}

/** Strip the quotes, index suffix, and arguments off a `DisplayIcon` value. */
function iconPath(value: string): string | undefined {
  const match = /^"?([^",]+\.exe)"?/.exec(value.trim())
  return match === undefined ? undefined : match[1]
}

/** Whether the configured PATH name resolves as an application. */
async function resolvesOnPath(name: string, signal: AbortSignal): Promise<string | undefined> {
  if (process.platform !== 'win32') {
    try {
      const result = await runNativeCommand('which', [name], signal)
      const found = (result.stdout ?? '').trim().split(/\r?\n/)[0]
      return found === '' ? undefined : found
    } catch {
      return undefined
    }
  }
  const probe = `$c = Get-Command -Name '${name}' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $c.Source }`
  try {
    const result = await runNativeCommand('powershell.exe', ['-NoProfile', '-Command', probe], signal)
    const found = (result.stdout ?? '').trim()
    return found === '' ? undefined : found
  } catch {
    return undefined
  }
}

/** Locate one candidate's executable inside an install location (depth ≤ 2). */
async function searchInstallLocation(root: string, candidate: Candidate): Promise<string | undefined> {
  if (root === '') return undefined
  const direct = [root, join(root, candidate.exeName), join(root, candidate.label), join(root, candidate.label, candidate.exeName)]
  for (const candidatePath of direct) {
    if (candidatePath.toLowerCase().endsWith('.exe') && await pathExists(candidatePath)) return candidatePath
  }
  if (candidate.id === 'wps') {
    const nested = await resolveWpsVersionRoot(root)
    if (nested !== undefined) return nested
  }
  try {
    const handle = await opendir(root)
    for await (const entry of handle) {
      if (!entry.isDirectory()) continue
      const nested = join(root, entry.name, candidate.exeName)
      if (await pathExists(nested)) return nested
    }
  } catch {
    return undefined
  }
  return undefined
}

/** How long the deep pass may run before it gives up (milliseconds). */
const DEEP_SCAN_BUDGET_MS = 90_000

/** How many directories the deep pass may open before it gives up. */
const DEEP_SCAN_MAX_DIRECTORIES = 120_000

/**
 * Walk the fixed drives for the missing executable names, breadth-first so the
 * shallow, conventional install directories answer first. Directory names the
 * skip list names are never opened, and both a time and a directory budget
 * bound the pass: a scan that hits a cap reports it instead of hanging.
 * @param targets - lower-case executable name → candidate, mutated as hits land.
 * @param found - candidate id → absolute path, mutated as hits land.
 * @param signal - caller cancellation.
 * @returns the truncation reason, or undefined when the walk completed.
 */
async function deepScan(
  targets: Map<string, Candidate>,
  found: Map<string, string>,
  signal: AbortSignal,
): Promise<string | undefined> {
  const queue = driveRoots().filter(root => existsSync(root))
  const deadline = Date.now() + DEEP_SCAN_BUDGET_MS
  let visited = 0
  while (queue.length > 0 && targets.size > 0) {
    if (signal.aborted) return 'cancelled'
    if (Date.now() > deadline) return 'time budget reached'
    if (visited >= DEEP_SCAN_MAX_DIRECTORIES) return 'directory budget reached'
    const directory = queue.shift() as string
    visited += 1
    let handle
    try {
      handle = await opendir(directory)
    } catch {
      continue
    }
    try {
      for await (const entry of handle) {
        if (signal.aborted) return 'cancelled'
        const lower = entry.name.toLowerCase()
        if (entry.isDirectory()) {
          if (SKIP_DIRECTORIES.has(lower) || entry.name.startsWith('$')) continue
          queue.push(join(directory, entry.name))
          continue
        }
        if (!entry.isFile()) continue
        const candidate = targets.get(lower)
        if (candidate === undefined) continue
        if (candidate.validate !== undefined && !candidate.validate(directory)) continue
        found.set(candidate.id, join(directory, entry.name))
        targets.delete(lower)
      }
    } catch {
      continue
    }
  }
  return undefined
}

/**
 * Discover the desktop applications this plugin can drive.
 *
 * The pass runs cheapest first — the plugin config, PATH, the well-known
 * install locations, then the registry — and only walks the drives when the
 * caller asks for it and something is still missing.
 * @param options - configured opener values (as a seed), the deep flag, and cancellation.
 * @returns the found applications plus any deep-scan truncation reason.
 */
export async function scanApps(options: {
  configured?: Partial<Record<AppSlot, string>>
  deep: boolean
  signal: AbortSignal
}): Promise<ScanResult> {
  const { configured = {}, deep, signal } = options
  const found = new Map<string, FoundApp>()
  const missing = new Set(CANDIDATES.map(candidate => candidate.id))

  for (const candidate of CANDIDATES) {
    const configuredValue = configured[candidate.slot]
    if (configuredValue === undefined || configuredValue.trim() === '') continue
    const value = configuredValue.trim()
    if (await pathExists(value)) {
      found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: value, source: 'config' })
      missing.delete(candidate.id)
    }
  }

  for (const candidate of CANDIDATES) {
    if (!missing.has(candidate.id)) continue
    for (const name of candidate.pathNames) {
      const resolved = await resolvesOnPath(name, signal)
      if (resolved === undefined) continue
      found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: resolved, source: 'path' })
      missing.delete(candidate.id)
      break
    }
  }

  for (const candidate of CANDIDATES) {
    if (!missing.has(candidate.id)) continue
    for (const location of staticLocations(candidate)) {
      if (candidate.exeName !== '' && location.toLowerCase().endsWith('.exe')) {
        if (await pathExists(location)) {
          found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: location, source: 'location' })
          missing.delete(candidate.id)
          break
        }
        continue
      }
      if (candidate.id === 'wps' && await pathExists(location)) {
        const nested = await resolveWpsVersionRoot(location)
        if (nested !== undefined) {
          found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: nested, source: 'location' })
          missing.delete(candidate.id)
          break
        }
      }
    }
  }

  if (missing.size > 0) {
    const rows = await readRegistry(signal)
    for (const candidate of CANDIDATES) {
      if (!missing.has(candidate.id)) continue
      for (const row of rows) {
        if (!candidate.registry.test(row.name)) continue
        const icon = row.icon === '' || row.icon === undefined ? undefined : iconPath(row.icon)
        const fromIcon = icon !== undefined && icon.toLowerCase().endsWith('.exe') && await pathExists(icon) ? icon : undefined
        const fromLocation = fromIcon ?? await searchInstallLocation(row.target ?? '', candidate)
        const resolved = fromLocation ?? (row.target !== undefined && row.target.toLowerCase().endsWith('.exe') && await pathExists(row.target) ? row.target : undefined)
        if (resolved === undefined) continue
        found.set(candidate.id, { id: candidate.id, slot: candidate.slot, label: candidate.label, command: resolved, source: 'registry' })
        missing.delete(candidate.id)
        break
      }
    }
  }

  let truncated: string | undefined
  if (deep && missing.size > 0) {
    const targets = new Map<string, Candidate>()
    for (const candidate of CANDIDATES) {
      if (missing.has(candidate.id)) targets.set(candidate.exeName, candidate)
    }
    const hits = new Map<string, string>()
    truncated = await deepScan(targets, hits, signal)
    for (const [id, command] of hits) {
      const candidate = CANDIDATES.find(entry => entry.id === id) as Candidate
      found.set(id, { id, slot: candidate.slot, label: candidate.label, command, source: 'scan' })
      missing.delete(id)
    }
  }

  return { found: [...found.values()], truncated: truncated ?? '' }
}

/** Validate one wire `save` payload into a state; undefined = malformed. */
export function parseState(input: unknown): SetupState | undefined {
  if (typeof input !== 'object' || input === null) return undefined
  const record = input as Record<string, unknown>
  const status = record.status
  if (status !== 'pending' && status !== 'ready' && status !== 'off') return undefined
  const apps = parseApps(record.apps)
  const usable = Object.values(apps).filter(entry => entry.enabled && entry.command.trim() !== '')
  // "Ready" without a usable application would claim configured behaviour the
  // plugin cannot deliver — the honest answer there is the declined state.
  return { version: 1, status: status === 'ready' && usable.length === 0 ? 'off' : status, apps }
}
