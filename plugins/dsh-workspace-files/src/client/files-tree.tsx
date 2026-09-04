/**
 * FileTree: the files tab's lazy, expandable directory tree. Rows load one
 * directory level at a time through the injected `list` (abort-guarded),
 * directories expand on click, files open through the extension-routed
 * primary opener (Markdown → MarkText, code → VS Code, everything else →
 * the default app) or through the per-row "open with…" menu. Hidden
 * dot-entries are filtered client-side behind a toggle.
 */

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  IconChevronDownOutline14, IconChevronRightOutline14, IconCloseOutline16,
  IconEllipsisOutline16, IconFolderClose16, IconFolderOpen16, IconRefreshOutline14,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorkspaceFilesEntry, WorkspaceFilesTranslate } from './contract.ts'
import css from './WorkspaceFilesPanel.module.css'

/** Props the panel passes to the tree: the injected openers plus the root path. */
export interface FileTreeProps {
  /** Absolute workspace root of the current session. */
  root: string
  /** List one directory level through the `/workspace-files` channel. */
  list: (path: string, signal?: AbortSignal) => Promise<import('./contract.ts').WorkspaceFilesListing>
  /** Open a path with the operating system's default application. */
  openPath: (path: string) => Promise<void>
  /** Open a path in VS Code (the configured `code` executable). */
  openInCode: (path: string) => Promise<void>
  /** Open a path in MarkText (the configured `marktext` executable). */
  openInMarktext: (path: string) => Promise<void>
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

/** Lower-cased extension of a base name (empty when it has none). */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

/** File presentation category: drives the primary opener and the row glyph. */
function fileKindOf(name: string): 'markdown' | 'code' | 'other' {
  const ext = extensionOf(name)
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown'
  if (CODE_EXTENSIONS.has(ext)) return 'code'
  const lower = name.toLowerCase()
  // `.env` and its per-environment twins (`.env.local`, `.env.example`) are
  // configuration code; extension-less build files open in the editor too.
  if (lower.startsWith('.env') || CODE_BASENAMES.has(lower)) return 'code'
  return 'other'
}

/** Small colored document glyph keyed by the file's presentation category. */
function FileGlyph({ kind }: { kind: 'markdown' | 'code' | 'other' }) {
  const color = kind === 'markdown'
    ? 'var(--dsw-alias-state-info-primary, #3b82f6)'
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

/** One per-tree transient open failure, with the path it applies to. */
interface OpenFailure {
  path: string
  message: string
}

/**
 * The file tree. Owns all tree state (loaded levels, expansion, hidden
 * toggle, the open menu, and in-flight open feedback); renders recursively.
 */
export function FileTree({ root, list, openPath, openInCode, openInMarktext, t }: FileTreeProps) {
  const [levels, setLevels] = useState<Record<string, import('./contract.ts').WorkspaceFilesListing>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [root]: true })
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showHidden, setShowHidden] = useState(false)
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const [busyPath, setBusyPath] = useState<string | null>(null)
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
    setMenuPath(null)
    setFailure(null)
    ensureLoaded(root)
  }

  const runOpen = (entry: WorkspaceFilesEntry, opener: (path: string) => Promise<void>): void => {
    setBusyPath(entry.path)
    setFailure(null)
    void opener(entry.path).then(
      () => { setBusyPath(null) },
      (reason: unknown) => {
        setBusyPath(null)
        setFailure({ path: entry.path, message: reason instanceof Error ? reason.message : String(reason) })
      },
    )
  }

  const primaryOpener = (entry: WorkspaceFilesEntry): ((path: string) => Promise<void>) | null => {
    if (entry.kind === 'dir') return null
    const kind = fileKindOf(entry.name)
    if (kind === 'markdown') return openInMarktext
    if (kind === 'code') return openInCode
    return openPath
  }

  const primaryLabel = (entry: WorkspaceFilesEntry): string => {
    const kind = fileKindOf(entry.name)
    if (kind === 'markdown') return t('file.openMarktext')
    if (kind === 'code') return t('file.openCode')
    return t('file.openDefault')
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
          const primary = primaryOpener(entry)
          return (
            <Fragment key={entry.path}>
              <div
                className={css.row}
                style={pad}
                data-file
                title={`${entry.path}\n${primaryLabel(entry)}`}
                onClick={() => { if (primary !== null) runOpen(entry, primary) }}
              >
                <span className={css.rowSpacer} />
                <FileGlyph kind={fileKindOf(entry.name)} />
                <span className={css.rowName}>{entry.name}</span>
                <button
                  type="button"
                  className={css.rowMenu}
                  aria-label={t('file.menuAria', { name: entry.name })}
                  title={t('file.menuAria', { name: entry.name })}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuPath(menuPath === entry.path ? null : entry.path)
                  }}
                >
                  <IconEllipsisOutline16 />
                </button>
              </div>
              {menuPath === entry.path && (
                <div className={css.openMenu} style={{ paddingLeft: depth * 14 + 34 }}>
                  <button type="button" className={css.menuItem} onClick={() => { setMenuPath(null); runOpen(entry, openInCode) }}>
                    {t('file.openCode')}
                  </button>
                  <button type="button" className={css.menuItem} onClick={() => { setMenuPath(null); runOpen(entry, openInMarktext) }}>
                    {t('file.openMarktext')}
                  </button>
                  <button type="button" className={css.menuItem} onClick={() => { setMenuPath(null); runOpen(entry, openPath) }}>
                    {t('file.openDefault')}
                  </button>
                </div>
              )}
            </Fragment>
          )
        })}
      </Fragment>
    )
  }

  const rootName = useMemo(() => {
    const trimmed = root.endsWith('/') || root.endsWith('\\') ? root.slice(0, -1) : root
    const sep = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
    return sep === -1 ? trimmed : trimmed.slice(sep + 1)
  }, [root])

  return (
    <div className={css.tree}>
      <div className={css.treeToolbar}>
        <span className={css.treeRoot} title={root}>{rootName || root}</span>
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
        {busyPath !== null && <div className={css.row}>{t('tree.loading')}</div>}
      </div>
      {failure !== null && (
        <div className={css.actionError}>
          <span className={css.actionErrorText}>{t('action.failed', { message: failure.message })}</span>
          <button
            type="button"
            className={css.inlineButton}
            onClick={() => {
              const path = failure.path
              setFailure(null)
              runOpen({ name: path, path, kind: 'file', hidden: false }, openPath)
            }}
          >
            {t('action.fallback')}
          </button>
        </div>
      )}
    </div>
  )
}
