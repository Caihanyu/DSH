/**
 * Contract types for the workspace-files sidebar tab: the inject face the
 * plugin supplies to its registration and the component's composed props.
 */

import type { PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'

/** The namespace-bound translate seat used by every panel subcomponent. */
export type WorkspaceFilesTranslate = TranslateNS<'workspace-files'>

/** One file or directory row (the host's wire type, browser-safe mirror). */
export interface WorkspaceFilesEntry {
  /** Base name shown in the tree row. */
  name: string
  /** Absolute host path — the client never joins path segments itself. */
  path: string
  /** Directory or file. */
  kind: 'dir' | 'file'
  /** Hidden by the host platform's convention (dot-prefixed on POSIX); the client owns whether to show it. */
  hidden: boolean
}

/** One listed directory level. */
export interface WorkspaceFilesListing {
  /** Absolute path of the listed directory. */
  path: string
  /** Direct children, directories first, each group name-sorted. */
  entries: WorkspaceFilesEntry[]
}

/** Application slot a configured executable fills. */
export type AppSlot = 'markdown' | 'code' | 'office'

/** How the whole feature was decided on this machine. */
export type SetupStatus = 'pending' | 'ready' | 'off'

/** One configured application, as the wizard left it. */
export interface AppEntry {
  /** Candidate identity (`typora`, `marktext`, `wps`, `vscode`). */
  id: string
  /** Display name used verbatim in the tree's labels. */
  label: string
  /** Absolute path (or PATH name) the opener runs. */
  command: string
  /** Whether the user allowed this plugin to use it. */
  enabled: boolean
}

/** The plugin's persisted setup state. */
export interface WorkspaceFilesState {
  version: 1
  /** `pending` = never answered; `ready` = configured; `off` = user declined. */
  status: SetupStatus
  /** Configured applications by slot; a missing slot has no opener. */
  apps: Partial<Record<AppSlot, AppEntry>>
}

/** One application a discovery pass resolved. */
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
  /** Applications the pass resolved. */
  found: FoundApp[]
  /** Filenames the deep pass gave up on before its caps (empty = complete). */
  truncated: string
}

/** The sidebar-tab inject face: the file openers this plugin owns. */
export interface WorkspaceFilesInjected {
  /** List one directory level with file/directory kinds through the `/workspace-files` channel. */
  list: (path: string, signal?: AbortSignal) => Promise<WorkspaceFilesListing>
  /** Read the persisted first-run setup. */
  readState: (signal?: AbortSignal) => Promise<WorkspaceFilesState>
  /** Discover the desktop applications this machine has (`deep` walks the drives). */
  scanApps: (deep: boolean, signal?: AbortSignal) => Promise<ScanResult>
  /** Persist the wizard's answer and return the stored state. */
  saveState: (state: WorkspaceFilesState) => Promise<WorkspaceFilesState>
  /** Open a path with the operating system's default application. */
  openPath: (path: string) => Promise<void>
  /** Open a path through the configured code-editor slot. */
  openInCode: (path: string) => Promise<void>
  /** Open a path through the configured Markdown-editor slot. */
  openInMarkdown: (path: string) => Promise<void>
  /** Open a path through the configured office-suite slot. */
  openInOffice: (path: string) => Promise<void>
}

/** Composed props of the workspace-files sidebar tab body. */
export type WorkspaceFilesPanelProps =
  & PropsRuntime<'sidebar.right.pane.tab'>
  & PropsLocale<'workspace-files'>
  & WorkspaceFilesInjected
