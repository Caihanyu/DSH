/**
 * FileTree: the files tab's lazy, expandable directory tree. Rows load one
 * directory level at a time through the injected `list` (abort-guarded),
 * directories expand on click, and files open on **double click** through the
 * slot opener its kind routes to (Markdown → the configured Markdown editor,
 * documents → the configured office suite, code → the configured code editor,
 * everything else → the default app). A row's "⋯" button opens an **anchored
 * open-with menu** — the same `Menu` primitive the workspace's own "⋯" menus
 * use. When the user configured no application at all (`passThrough`), rows
 * behave exactly like the shipped tree: one click, default application, no
 * menu and no routing. Hidden dot-entries are filtered behind a toggle.
 */

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  IconBrowseOutline16, IconChevronDownOutline14, IconChevronRightOutline14, IconCloseOutline16,
  IconCodeOutline16, IconEditOutline16, IconEllipsisOutline16, IconFolderClose16, IconFolderOpen16,
  IconRefreshOutline14, IconRightUpOutline16, IconSettingsOutline14, Menu, type MenuEntry,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  MarkdownOpener, WorkspaceFilesEntry, WorkspaceFilesTranslate,
} from './contract.ts'
import css from './WorkspaceFilesPanel.module.css'

/** Display names of the slot openers the tree can route to, when configured. */
export interface SlotOpeners {
  /** Configured Markdown editor label. */
  markdown?: string | undefined
  /** Configured code-editor label. */
  code?: string | undefined
  /** Configured office-suite label. */
  office?: string | undefined
}

/** Props the panel passes to the tree: the injected openers plus the root path. */
export interface FileTreeProps {
  /** Absolute workspace root of the current session. */
  root: string
  /** List one directory level through the `/workspace-files` route. */
  list: (path: string, signal?: AbortSignal) => Promise<import('./contract.ts').WorkspaceFilesListing>
  /** Open a path with the operating system's default application. */
  openPath: (path: string) => Promise<void>
  /** Open a path through the configured code-editor slot. */
  openInCode: (path: string) => Promise<void>
  /** Open a path through the configured Markdown-editor slot. */
  openInMarkdown: (path: string) => Promise<void>
  /** Open a path through the configured office-suite slot. */
  openInOffice: (path: string) => Promise<void>
  /** Configured application labels by slot (absent = the slot has no application). */
  openers: SlotOpeners
  /** Whether the user configured nothing, making rows behave like the shipped tree. */
  passThrough: boolean
  /** Open the open-with settings dialog. */
  onConfigure: () => void
  /** Open a path as a Sidebar resource, in the panel's own viewers. */
  openPreview: (path: string) => void
  /** Localized copy. */
  t: WorkspaceFilesTranslate
}

const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd'])
const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts', '.py', '.pyw',
  '.sh', '.bash', '.zsh', '.ps1', '.psm1', '.json', '.jsonc', '.json5',
  '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf', '.editorconfig',
  '.html', '.htm', '.xhtml', '.css', '.scss', '.less', '.sass', '.vue', '.svelte',
  '.rs', '.go', '.java', '.kt', '.c', '.h', '.cpp', '.hpp', '.cc', '.cs',
  '.sql', '.xml', '.svg', '.php', '.rb', '.swift', '.lua', '.pl', '.r', '.dart',
  '.ex', '.exs', '.erl', '.hs', '.scala', '.groovy', '.dockerfile', '.tf',
])
/** Extension-less build/ignore/editor files whose content is code, not prose. */
const CODE_BASENAMES = new Set([
  'dockerfile', 'makefile', 'justfile', 'gnumakefile',
  '.gitignore', '.gitattributes', '.gitmodules', '.dockerignore', '.npmrc',
  '.yarnrc', '.pypirc', '.eslintrc', '.prettierrc', 'license', 'copying',
])
/** Document extensions the configured office suite takes over. */
const OFFICE_EXTENSIONS = new Set([
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf',
  '.txt', '.csv', '.rtf', '.wps', '.et', '.dps',
])

/** Lower-cased extension of a base name (empty when it has none). */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

/** File presentation category: drives the primary opener and the row glyph. */
function fileKindOf(name: string): 'markdown' | 'office' | 'code' | 'other' {
  const ext = extensionOf(name)
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown'
  if (OFFICE_EXTENSIONS.has(ext)) return 'office'
  if (CODE_EXTENSIONS.has(ext)) return 'code'
  const lower = name.toLowerCase()
  // `.env` and its per-environment twins (`.env.local`, `.env.example`) are
  // configuration code; extension-less build files open in the editor too.
  if (lower.startsWith('.env') || CODE_BASENAMES.has(lower)) return 'code'
  return 'other'
}

/** Base name of an absolute path, for the menu heading. */
function basenameOf(path: string): string {
  const trimmed = path.endsWith('/') || path.endsWith('\\') ? path.slice(0, -1) : path
  const sep = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return sep === -1 ? trimmed : trimmed.slice(sep + 1)
}

/** Small colored document glyph keyed by the file's presentation category. */
function FileGlyph({ kind }: { kind: 'markdown' | 'office' | 'code' | 'other' }) {
  const color = kind === 'markdown'
    ? 'var(--dsw-alias-state-info-primary, #3b82f6)'
    : kind === 'office'
      ? 'var(--dsw-alias-state-warning-primary, #f59e0b)'
      : kind === 'code'
        ? 'var(--dsw-alias-state-success-primary, #22c55e)'
        : 'var(--dsw-alias-label-tertiary, #94a3b8)'
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden className={css.fileGlyph}>
      <path
        d="M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"
        fill={color} opacity="0.18"
      />
      <path
        d="M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"
        fill="none" stroke={color} strokeWidth="1.1"
      />
      <path d="M9 1.5v3.5h3.5" fill="none" stroke={color} strokeWidth="1.1" />
    </svg>
  )
}

/** One per-tree transient open failure, with the path (and opener) it applies to. */
interface OpenFailure {
  path: string
  message: string
  /** Re-run exactly the opener that failed. */
  retry: () => void
}

/**
 * The file tree. Owns all tree state (loaded levels, expansion, hidden
 * toggle, the open-with menu's target, and in-flight open feedback);
 * renders recursively.
 */
export function FileTree({
  root, list, openPath, openInCode, openInMarkdown, openInOffice, openers, passThrough,
  onConfigure, openPreview, t,
}: FileTreeProps) {
  const [levels, setLevels] = useState<Record<string, import('./contract.ts').WorkspaceFilesListing>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [root]: true })
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showHidden, setShowHidden] = useState(false)
  /** The file whose open-with menu is showing (null = closed). */
  const [menuEntry, setMenuEntry] = useState<WorkspaceFilesEntry | null>(null)
  const [failure, setFailure] = useState<OpenFailure | null>(null)
  const aborters = useRef(new Map<string, AbortController>())

  const ensureLoaded = (path: string): void => {
    setLoading(prev => (prev[path] === true ? prev : { ...prev, [path]: true }))
    setErrors((prev) => {
      if (prev[path] === undefined) return prev
      const { [path]: _dropped, ...rest } = prev
      return rest
    })
    const controller = new AbortController()
    aborters.current.set(path, controller)
    void list(path, controller.signal).then(
      (level) => {
        if (controller.signal.aborted) return
        aborters.current.delete(path)
        setLevels(prev => ({ ...prev, [path]: level }))
        setLoading((prev) => {
          const { [path]: _dropped, ...rest } = prev
          return rest
        })
      },
      (reason: unknown) => {
        if (controller.signal.aborted) return
        aborters.current.delete(path)
        setLoading((prev) => {
          const { [path]: _dropped, ...rest } = prev
          return rest
        })
        setErrors(prev => ({
          ...prev,
          [path]: reason instanceof Error ? reason.message : String(reason),
        }))
      },
    )
  }

  // Load the root level on mount (and again when the root path changes).
  useEffect(() => { ensureLoaded(root) }, [root])

  const toggle = (path: string): void => {
    setExpanded(prev => ({ ...prev, [path]: prev[path] !== true }))
    if (expanded[path] !== true) ensureLoaded(path)
  }

  const refresh = (): void => {
    for (const controller of aborters.current.values()) controller.abort()
    aborters.current.clear()
    setLevels({})
    setErrors({})
    setLoading({})
    setExpanded({ [root]: true })
    setMenuEntry(null)
    setFailure(null)
    ensureLoaded(root)
  }

  /**
   * Launch one file with one opener. The row itself carries no progress state:
   * a launch that fails reports through the banner below the tree, and a launch
   * that succeeds needs no acknowledgement at all.
   */
  const runOpen = (entry: WorkspaceFilesEntry, opener: (path: string) => Promise<void>): void => {
    setFailure(null)
    void opener(entry.path).then(
      () => undefined,
      (reason: unknown) => {
        setFailure({
          path: entry.path,
          message: reason instanceof Error ? reason.message : String(reason),
          retry: () => { runOpen(entry, opener) },
        })
      },
    )
  }

  /**
   * The opener one file's kind routes to, with the label its row advertises.
   * A kind without a configured application falls back to the next sensible
   * slot and finally to the system default, so a half-configured machine still
   * opens every file.
   */
  const primaryAction = (entry: WorkspaceFilesEntry): { run: () => void, label: string } => {
    const kind = fileKindOf(entry.name)
    const markdown = openers.markdown
    const office = openers.office
    const code = openers.code
    if (kind === 'markdown' && markdown !== undefined) {
      return { run: () => { runOpen(entry, openInMarkdown) }, label: t('file.openWith', { app: markdown }) }
    }
    if (kind === 'office' && office !== undefined) {
      return { run: () => { runOpen(entry, openInOffice) }, label: t('file.openWith', { app: office }) }
    }
    if (kind === 'code' && code !== undefined) {
      return { run: () => { runOpen(entry, openInCode) }, label: t('file.openWith', { app: code }) }
    }
    if (kind === 'markdown' && code !== undefined) {
      return { run: () => { runOpen(entry, openInCode) }, label: t('file.openWith', { app: code }) }
    }
    return { run: () => { runOpen(entry, openPath) }, label: t('file.openDefault') }
  }

  /**
   * Rows of one file's "⋯" menu: every way this plugin can hand the path to an
   * application. Every configured slot appears — an open-with menu is exactly
   * where a user looks to override the kind's default — and a slot the user
   * turned off stays out of the list.
   */
  const menuItems = (entry: WorkspaceFilesEntry): MenuEntry[] => {
    const entries: MenuEntry[] = [
      { id: 'preview', label: t('file.openPreview'), icon: <IconBrowseOutline16 /> },
      { type: 'separator', id: 'openers' },
    ]
    if (openers.markdown !== undefined) {
      entries.push({ id: 'markdown', label: t('file.openWith', { app: openers.markdown }), icon: <IconEditOutline16 /> })
    }
    if (openers.office !== undefined) {
      entries.push({ id: 'office', label: t('file.openWith', { app: openers.office }), icon: <IconEditOutline16 /> })
    }
    if (openers.code !== undefined) {
      entries.push({ id: 'code', label: t('file.openWith', { app: openers.code }), icon: <IconCodeOutline16 /> })
    }
    entries.push({ id: 'default', label: t('file.openDefault'), icon: <IconRightUpOutline16 /> })
    return entries
  }

  /** Run one menu action for a row, closing the menu first so the launch feels immediate. */
  const runMenuAction = (entry: WorkspaceFilesEntry, action: string): void => {
    setMenuEntry(null)
    if (action === 'preview') {
      openPreview(entry.path)
      return
    }
    if (action === 'markdown') runOpen(entry, openInMarkdown)
    else if (action === 'office') runOpen(entry, openInOffice)
    else if (action === 'code') runOpen(entry, openInCode)
    else runOpen(entry, openPath)
  }

  const renderLevel = (path: string, depth: number): ReactNode => {
    const level = levels[path]
    const isLoading = loading[path] === true
    const error = errors[path]
    const pad = { paddingLeft: depth * 14 + 10 }
    if (error !== undefined) {
      return (
        <Fragment key={path}>
          <div className={css.row} style={pad}>
            <span className={css.errorText}>{t('tree.error')}</span>
            <button type="button" className={css.inlineButton} onClick={() => { ensureLoaded(path) }}>{t('tree.retry')}</button>
          </div>
          <div className={css.rowError} style={pad}>{error}</div>
        </Fragment>
      )
    }
    if (level === undefined) {
      return isLoading
        ? <div key={path} className={css.row} style={pad}>{t('tree.loading')}</div>
        : null
    }
    const visible = level.entries.filter(entry => !entry.hidden || showHidden)
    if (visible.length === 0) {
      return <div key={path} className={css.row} style={pad}>{t('tree.empty')}</div>
    }
    return (
      <Fragment key={path}>
        {visible.map((entry) => {
          if (entry.kind === 'dir') {
            const open = expanded[entry.path] === true
            return (
              <Fragment key={entry.path}>
                <div
                  className={css.row}
                  style={pad}
                  data-dir
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  title={entry.path}
                  onClick={() => { toggle(entry.path) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(entry.path) } }}
                >
                  {open ? <IconChevronDownOutline14 className={css.chevron} /> : <IconChevronRightOutline14 className={css.chevron} />}
                  {open ? <IconFolderOpen16 className={css.folderIcon} /> : <IconFolderClose16 className={css.folderIcon} />}
                  <span className={css.rowName}>{entry.name}</span>
                </div>
                {open && renderLevel(entry.path, depth + 1)}
              </Fragment>
            )
          }
          const action = primaryAction(entry)
          if (passThrough) {
            // Nothing is configured, so the row behaves exactly like the shipped
            // tree: one click, system default application, no menu, no routing.
            return (
              <Fragment key={entry.path}>
                <button
                  type="button"
                  className={`${css.row} ${css.rowButton}`}
                  style={pad}
                  data-file
                  title={`${entry.path}\n${t('file.singleHint', { action: action.label })}`}
                  onClick={() => { action.run() }}
                >
                  <span className={css.rowSpacer} />
                  <FileGlyph kind={fileKindOf(entry.name)} />
                  <span className={css.rowName}>{entry.name}</span>
                </button>
              </Fragment>
            )
          }
          return (
            <Fragment key={entry.path}>
              <div
                className={css.row}
                style={pad}
                data-file
                role="button"
                tabIndex={0}
                title={`${entry.path}\n${t('file.openHint', { action: action.label })}`}
                // `detail === 2` is the double-click: a single click selects
                // nothing here, so a half-intended click never launches an app.
                onClick={(e) => { if (e.detail === 2) action.run() }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  e.preventDefault()
                  action.run()
                }}
              >
                <span className={css.rowSpacer} />
                <FileGlyph kind={fileKindOf(entry.name)} />
                <span className={css.rowName}>{entry.name}</span>
                <Menu
                  open={menuEntry?.path === entry.path}
                  portal
                  align="start"
                  side="bottom"
                  autoFocus
                  items={menuItems(entry)}
                  onSelect={(id) => { runMenuAction(entry, id) }}
                  onClose={() => { setMenuEntry(null) }}
                  anchor={(
                    <button
                      type="button"
                      className={css.rowMenu}
                      aria-label={t('file.menuAria', { name: entry.name })}
                      title={t('file.menuAria', { name: entry.name })}
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuEntry(prev => (prev?.path === entry.path ? null : entry))
                      }}
                    >
                      <IconEllipsisOutline16 />
                    </button>
                  )}
                />
              </div>
            </Fragment>
          )
        })}
      </Fragment>
    )
  }

  const rootName = useMemo(() => basenameOf(root), [root])

  return (
    <div className={css.tree}>
      <div className={css.treeToolbar}>
        <span className={css.treeRoot} title={root}>{rootName || root}</span>
        <button
          type="button"
          className={css.iconButton}
          aria-label={t('setup.button')}
          title={t('setup.button')}
          onClick={() => { onConfigure() }}
        >
          <IconSettingsOutline14 />
        </button>
        <button
          type="button"
          className={css.iconButton}
          aria-label={t('refresh')}
          title={t('refresh')}
          onClick={() => { refresh() }}
        >
          <IconRefreshOutline14 />
        </button>
        <button
          type="button"
          className={css.iconButton}
          aria-pressed={showHidden}
          title={showHidden ? t('tree.hideHidden') : t('tree.showHidden')}
          onClick={() => { setShowHidden(prev => !prev) }}
        >
          <IconCloseOutline16 />
        </button>
      </div>
      <div className={css.treeBody}>
        {renderLevel(root, 0)}
      </div>
      {failure !== null && (
        <div className={css.actionError}>
          <span className={css.actionErrorText}>{t('action.failed', { message: failure.message })}</span>
          <button
            type="button"
            className={css.inlineButton}
            onClick={() => {
              const { retry } = failure
              setFailure(null)
              retry()
            }}
          >
            {t('action.retry')}
          </button>
          <button
            type="button"
            className={css.inlineButton}
            onClick={() => {
              const path = failure.path
              setFailure(null)
              runOpen({ name: basenameOf(path), path, kind: 'file', hidden: false }, openPath)
            }}
          >
            {t('action.fallback')}
          </button>
        </div>
      )}
    </div>
  )
}
