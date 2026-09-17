/**
 * FileTree: the panel's lazy directory tree, drawn with the shipped workspace
 * tree's metrics (ui-sidebar-files): a 38px header holding the root path and
 * its tools, one 18px-indented level per expanded directory, folder glyphs
 * that toggle on click, and the primitives' coloured file-type icons. Rows
 * load one directory level at a time through the injected `list`
 * (abort-guarded); a per-row menu offers create-in-directory and delete, and
 * the leading ".." row walks above the tree's initial root.
 */

import { useMemo, useState } from 'react'
import {
  FileTypeIcon, IconEllipsisOutline16, IconFolderClose16, IconFolderOpen16,
  IconFolderOpenOutline16, IconRefreshOutline16, Menu, classifyFileType,
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

/** Parent of an absolute path, tolerant of both `/` and `\` separators. */
function parentOf(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, '')
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  if (index <= 0) return path // filesystem root: parent is itself
  return trimmed.slice(0, index)
}

/**
 * Split a root path into the greyed directory part and the last segment, the
 * way the pane header shows it (ui-sidebar-files `pathPartsOf`).
 */
function pathParts(path: string): { directory: string; name: string } {
  const trimmed = path.replace(/[\\/]+$/, '')
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  if (index < 0) return { directory: '', name: trimmed }
  const name = trimmed.slice(index + 1)
  const directory = index === 0 ? '/' : trimmed.slice(0, index + 1)
  return { directory, name: name === '' ? trimmed : name }
}

/** The recursive row: one entry with its expansion and row menu. */
function TreeRow({
  entry, list, showHidden, onOpenFile, onCreate, onDelete, t,
}: {
  entry: SshFileEntry
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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
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
    <li className={css.item} data-ssh-entry={entry.kind}>
      <div className={css.treeRow}>
        <button
          type="button"
          className={css.treeLabel}
          onClick={() => { void toggle() }}
          title={entry.path}
          aria-expanded={entry.kind === 'dir' ? expanded : undefined}
        >
          {entry.kind === 'dir'
            ? (expanded
                ? <IconFolderOpen16 className={css.dirIcon} />
                : <IconFolderClose16 className={css.dirIcon} />)
            : <FileTypeIcon kind={classifyFileType(entry.name)} size={16} className={css.fileIcon} />}
          <span className={css.treeName}>{entry.name}</span>
        </button>
        <span className={css.rowActions}>
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
                className={css.rowAction}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={entry.name}
                onClick={() => { setMenuOpen(true) }}
              >
                <IconEllipsisOutline16 />
              </button>
            )}
          />
        </span>
      </div>
      {expanded && (
        <ul className={css.level}>
          {loading && children === null && <li className={css.note}>{t('tree.loading')}</li>}
          {error !== null && (
            <li className={`${css.note} ${css.noteError}`} role="alert">{t('tree.error')}：{error}</li>
          )}
          {children !== null && visibleChildren.map(child => (
            <TreeRow
              key={child.path}
              entry={child}
              list={list}
              showHidden={showHidden}
              onOpenFile={onOpenFile}
              onCreate={onCreate}
              onDelete={onDelete}
              t={t}
            />
          ))}
          {children !== null && visibleChildren.length === 0 && (
            <li className={css.note}>{t('tree.empty')}</li>
          )}
        </ul>
      )}
    </li>
  )
}

/** The file tree: header row, parent row, and the recursive entries. */
export function FileTree({ root, list, onOpenFile, onCreate, onDelete, t }: FileTreeProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [showHidden, setShowHidden] = useState(false)
  const [parentMenu, setParentMenu] = useState(false)

  // The root row lives here so a refresh remounts only the top level.
  const rootEntry: SshFileEntry = { name: root, path: root, kind: 'dir', hidden: false }
  const parent = parentOf(root)
  const { directory, name } = pathParts(root)

  return (
    <div className={css.treeRoot}>
      <div className={css.treeToolbar}>
        <div className={css.treePath} title={root}>
          {directory !== '' && <span className={css.treePathDirectory}>{directory}</span>}
          <span className={css.treePathName}>{name}</span>
        </div>
        <button
          type="button"
          className={css.chipButton}
          onClick={() => { setShowHidden(value => !value) }}
          title={showHidden ? t('tree.hideHidden') : t('tree.showHidden')}
        >
          {showHidden ? t('tree.hideHidden') : t('tree.showHidden')}
        </button>
        <button
          type="button"
          className={css.toolbarButton}
          onClick={() => { setRefreshKey(value => value + 1) }}
          title={t('tree.refresh')}
          aria-label={t('tree.refresh')}
        >
          <IconRefreshOutline16 />
        </button>
      </div>
      <div className={css.tree} role="tree" aria-label={root}>
        <ul className={css.level}>
          <li className={css.item}>
            <div className={css.treeRow}>
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
                    <IconFolderOpenOutline16 className={css.dirIcon} />
                    <span className={css.treeName}>{t('tree.parent')}</span>
                  </button>
                )}
              />
            </div>
          </li>
          <TreeRow
            key={`${root}-${refreshKey}`}
            entry={rootEntry}
            list={list}
            showHidden={showHidden}
            onOpenFile={onOpenFile}
            onCreate={onCreate}
            onDelete={onDelete}
            t={t}
          />
        </ul>
      </div>
    </div>
  )
}
