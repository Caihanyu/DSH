/**
 * FileTree: the panel's lazy, expandable directory tree. Rows load one
 * directory level at a time through the injected `list` (abort-guarded),
 * directories expand on click, files open the editor through `onOpenFile`.
 * A per-row menu offers create-in-directory and delete. A leading ".." row
 * navigates to the parent directory, so the tree is not confined to its root.
 */

import { useMemo, useState } from 'react'
import {
  IconChevronDownOutline14, IconChevronRightOutline14, IconEllipsisOutline16,
  IconFolderClose16, IconRefreshOutline14, Menu,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SshFileEntry, SshFilesTranslate, SshListing } from './contract.ts'
import css from './SshFilesPanel.module.css'

/** Props the panel passes to the tree. */
export interface FileTreeProps {
  /** Absolute root of the tree (the connected server's root). */
  root: string
  /** List one directory level on the active filesystem. */
  list: (path: string, signal?: AbortSignal) => Promise<SshListing>
  /** Open a file in the panel's editor. */
  onOpenFile: (path: string) => void
  /** Open the create-file/dir modal for one directory. */
  onCreate: (dirPath: string, kind: 'file' | 'dir') => void
  /** Request deletion of one entry. */
  onDelete: (entry: SshFileEntry) => void
  /** Localized copy. */
  t: SshFilesTranslate
}

/** One transient open failure, with the path it applies to. */
interface OpenFailure {
  path: string
  message: string
}

/** Parent of an absolute path, tolerant of both `/` and `\` separators. */
function parentOf(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, '')
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  if (index <= 0) return path // filesystem root: parent is itself
  return trimmed.slice(0, index)
}

/** Small colored document glyph keyed by the row kind. */
function FileGlyph({ kind }: { kind: 'dir' | 'file' }) {
  return kind === 'dir'
    ? <IconFolderClose16 className={css.dirGlyph} />
    : (
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden className={css.fileGlyph}>
        <path
          d="M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"
          fill="var(--dsw-alias-label-tertiary, #94a3b8)" opacity="0.18"
        />
        <path
          d="M4 1.5h5l3.5 3.5v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"
          fill="none" stroke="var(--dsw-alias-label-tertiary, #94a3b8)" strokeWidth="1.1"
        />
        <path d="M9 1.5v3.5h3.5" fill="none" stroke="var(--dsw-alias-label-tertiary, #94a3b8)" strokeWidth="1.1" />
      </svg>
    )
}

/** The recursive row: one entry with expansion/actions. */
function TreeRow({
  entry, depth, list, showHidden, onOpenFile, onCreate, onDelete, t,
}: {
  entry: SshFileEntry
  depth: number
  list: FileTreeProps['list']
  showHidden: boolean
  onOpenFile: FileTreeProps['onOpenFile']
  onCreate: FileTreeProps['onCreate']
  onDelete: FileTreeProps['onDelete']
  t: SshFilesTranslate
}) {
  const [children, setChildren] = useState<SshFileEntry[] | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const toggle = async (): Promise<void> => {
    if (entry.kind !== 'dir') {
      onOpenFile(entry.path)
      return
    }
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (children !== null) return
    setLoading(true)
    setError(null)
    try {
      const listing = await list(entry.path)
      setChildren(listing.entries)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  const menuItems = useMemo(() => {
    const items: Array<{ id: string; label: string; danger?: boolean }> = []
    if (entry.kind === 'dir') {
      items.push(
        { id: 'new-file', label: t('tree.newFile') },
        { id: 'new-dir', label: t('tree.newDir') },
      )
    }
    items.push({ id: 'delete', label: t('tree.delete'), danger: true })
    return items
  }, [entry.kind, t])

  const onMenuSelect = (id: string): void => {
    setMenuOpen(false)
    switch (id) {
      case 'new-file': onCreate(entry.path, 'file'); break
      case 'new-dir': onCreate(entry.path, 'dir'); break
      case 'delete': onDelete(entry); break
    }
  }

  const visibleChildren = showHidden
    ? (children ?? [])
    : (children ?? []).filter(child => !child.hidden)

  return (
    <div>
      <div
        className={`${css.treeRow} ${entry.kind === 'dir' ? css.treeRowDir : css.treeRowFile}`}
        data-kind={entry.kind}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        role="treeitem"
        aria-expanded={entry.kind === 'dir' ? expanded : undefined}
      >
        <button type="button" className={css.treeChevron} aria-hidden tabIndex={-1} onClick={() => { void toggle() }}>
          {entry.kind === 'dir'
            ? (loading
                ? <span className={css.loadingDot} />
                : expanded ? <IconChevronDownOutline14 /> : <IconChevronRightOutline14 />)
            : null}
        </button>
        <button type="button" className={css.treeLabel} onClick={() => { void toggle() }} title={entry.path}>
          <FileGlyph kind={entry.kind} />
          <span className={css.treeName}>{entry.name}</span>
        </button>
        <Menu
          open={menuOpen}
          onClose={() => { setMenuOpen(false) }}
          items={menuItems}
          onSelect={onMenuSelect}
          align="end"
          portal
          anchor={(
            <button
              type="button"
              className={css.iconButton}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={entry.name}
              onClick={() => { setMenuOpen(true) }}
            >
              <IconEllipsisOutline16 />
            </button>
          )}
        />
      </div>
      {expanded && (
        <div role="group">
          {error !== null && (
            <div className={css.treeError} style={{ paddingLeft: `${24 + depth * 14}px` }}>
              {t('tree.error')}：{error}
            </div>
          )}
          {visibleChildren.map(child => (
            <TreeRow
              key={child.path}
              entry={child}
              depth={depth + 1}
              list={list}
              showHidden={showHidden}
              onOpenFile={onOpenFile}
              onCreate={onCreate}
              onDelete={onDelete}
              t={t}
            />
          ))}
          {visibleChildren.length === 0 && error === null && (
            <div className={css.treeEmpty} style={{ paddingLeft: `${24 + depth * 14}px` }}>
              {t('tree.empty')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** The file tree: parent row plus recursive entries under the root. */
export function FileTree({ root, list, onOpenFile, onCreate, onDelete, t }: FileTreeProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [showHidden, setShowHidden] = useState(false)
  const [parentMenu, setParentMenu] = useState(false)
  const [failure, setFailure] = useState<OpenFailure | null>(null)

  // The root row lives here so a refresh remounts only the top level.
  const rootEntry: SshFileEntry = { name: root, path: root, kind: 'dir', hidden: false }
  const parent = parentOf(root)

  return (
    <div className={css.treeRoot}>
      <div className={css.treeToolbar}>
        <button
          type="button"
          className={css.toolbarButton}
          onClick={() => { setRefreshKey(value => value + 1) }}
          title={t('tree.refresh')}
          aria-label={t('tree.refresh')}
        >
          <IconRefreshOutline14 />
        </button>
        <button
          type="button"
          className={css.toolbarButton}
          onClick={() => { setShowHidden(value => !value) }}
          title={showHidden ? t('tree.hideHidden') : t('tree.showHidden')}
        >
          {showHidden ? t('tree.showHidden') : t('tree.hideHidden')}
        </button>
      </div>
      {failure !== null && (
        <div className={css.treeError} role="alert">
          {t('tree.openFailed', { message: failure.message })}
        </div>
      )}
      <div role="tree" aria-label={root} className={css.tree}>
        <div className={css.treeRow} data-kind="dir" style={{ paddingLeft: '8px' }}>
          <Menu
            open={parentMenu}
            onClose={() => { setParentMenu(false) }}
            items={[
              { id: 'new-file', label: t('tree.newFile') },
              { id: 'new-dir', label: t('tree.newDir') },
            ]}
            onSelect={(id) => {
              setParentMenu(false)
              if (id === 'new-file') onCreate(parent, 'file')
              if (id === 'new-dir') onCreate(parent, 'dir')
            }}
            align="end"
            portal
            anchor={(
              <button
                type="button"
                className={css.treeLabel}
                onClick={() => { setParentMenu(true) }}
                title={t('tree.parent')}
              >
                <span className={css.parentLabel}>..</span>
                <span className={css.treeName}>{t('tree.parent')}</span>
              </button>
            )}
          />
        </div>
        <TreeRow
          key={`${root}-${refreshKey}`}
          entry={rootEntry}
          depth={0}
          list={list}
          showHidden={showHidden}
          onOpenFile={onOpenFile}
          onCreate={onCreate}
          onDelete={onDelete}
          t={t}
        />
      </div>
    </div>
  )
}
