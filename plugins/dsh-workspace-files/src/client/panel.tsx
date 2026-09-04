/**
 * WorkspaceFilesPanel: the details-column occupant this plugin registers.
 * A tabbed panel — "Files" (the workspace file tree, rooted at the current
 * session's working directory) and "Tools" (the tool-call inspector). The
 * panel auto-opens the column is not its job: ui-conversation's inspect
 * gesture opens it, and this plugin's own registration wins the column the
 * moment it is open.
 */

import { useEffect, useState } from 'react'
import { IconCloseOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { WorkspaceFilesPanelProps } from './contract.ts'
import { FileTree } from './files-tree.tsx'
import { ToolDetails } from './tool-details.tsx'
import css from './WorkspaceFilesPanel.module.css'

type Tab = 'files' | 'tool'

/** Full composed props: the details runtime share, the locale seat, and the inject face. */
export type PanelProps = WorkspaceFilesPanelProps

/** The tabbed details panel. */
export function WorkspaceFilesPanel(props: WorkspaceFilesPanelProps) {
  const {
    useSessions, useSession, sessionId, t,
    openDetails, closeDetails, list, openPath, openInCode, openInMarktext,
  } = props
  // Session workspace root: the file tree's base. An omitted cwd (blank
  // session) renders the empty state rather than a fabricated root.
  const cwd = useSessions(store => store.byId[sessionId]?.cwd)
  const [tab, setTab] = useState<Tab>('files')

  // The column opens for the session that mounts this panel (the user asked
  // for the file browser beside every conversation); closing it keeps it
  // closed for that session, and the next session's remount opens it again.
  useEffect(() => { openDetails() }, [openDetails])

  return (
    <div className={css.root}>
      <header className={css.header}>
        <div className={css.tabs} role="tablist" aria-label={t('panel.title')}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'files'}
            className={tab === 'files' ? `${css.tab} ${css.tabActive}` : css.tab}
            onClick={() => { setTab('files') }}
          >
            {t('tab.files')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tool'}
            className={tab === 'tool' ? `${css.tab} ${css.tabActive}` : css.tab}
            onClick={() => { setTab('tool') }}
          >
            {t('tab.tool')}
          </button>
        </div>
        <button
          type="button"
          className={css.close}
          aria-label={t('panel.close')}
          title={t('panel.close')}
          onClick={() => { closeDetails() }}
        >
          <IconCloseOutline16 />
        </button>
      </header>
      <div className={css.body}>
        {tab === 'files'
          ? (
            cwd === undefined
              ? <div className={css.empty}>{t('tree.empty')}</div>
              : (
                <FileTree
                  key={cwd}
                  root={cwd}
                  list={list}
                  openPath={openPath}
                  openInCode={openInCode}
                  openInMarktext={openInMarktext}
                  t={t}
                />
              )
          )
          : <ToolDetails useSession={useSession} t={t} />}
      </div>
    </div>
  )
}
