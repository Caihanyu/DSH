/**
 * WorkspaceFilesPanel: the right Sidebar's `files` tab body. The panel draws
 * the current session's workspace file tree, rooted at that session's working
 * directory; the tab strip owns opening, closing, and the chip title, so the
 * panel carries no header of its own. It also owns the first-run setup: the
 * plugin asks once which applications it may drive, and until that answer
 * exists the tree behaves like the shipped one.
 */

import { useEffect, useState } from 'react'
import { sessionFileAddress } from '@deepseek-ai/dsh-util-workspace-path'
import type { WorkspaceFilesPanelProps, WorkspaceFilesState } from './contract.ts'
import { FileTree, type SlotOpeners } from './files-tree.tsx'
import { SetupDialog } from './setup-dialog.tsx'
import css from './WorkspaceFilesPanel.module.css'

/** Full composed props: the tab runtime share, the locale seat, and the inject face. */
export type PanelProps = WorkspaceFilesPanelProps

/** One slot's display label, when the user enabled it and it carries a path. */
function openerLabel(
  state: WorkspaceFilesState | null,
  slot: 'markdown' | 'code' | 'office',
): string | undefined {
  const entry = state?.apps[slot]
  return entry !== undefined && entry.enabled && entry.command.trim() !== '' ? entry.label : undefined
}

/** The workspace file tree tab body. */
export function WorkspaceFilesPanel(props: WorkspaceFilesPanelProps) {
  const {
    useSessions, useTabInfo, sessionId, t,
    list, readState, scanApps, saveState, openPath, openInCode, openInMarkdown, openInOffice,
  } = props
  // Session workspace root: the file tree's base. An omitted cwd (blank
  // session) renders the empty state rather than a fabricated root.
  const cwd = useSessions(store => store.byId[sessionId]?.cwd)
  const { tab } = useTabInfo()
  const [state, setState] = useState<WorkspaceFilesState | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void readState(controller.signal).then(
      (stored) => {
        if (controller.signal.aborted) return
        setState(stored)
        // The first open is the only moment the plugin may ask: show the wizard
        // before the tree can advertise an opener the user never chose.
        if (stored.status === 'pending') setSetupOpen(true)
      },
      () => {
        // An unreadable state means no answer exists: behave like the shipped
        // tree rather than promising openers this plugin cannot verify.
        if (!controller.signal.aborted) setState({ version: 1, status: 'off', apps: {} })
      },
    )
    return () => { controller.abort() }
  }, [readState])

  /**
   * Open one file in the Sidebar's own viewers. The address names the file
   * through this session, so the resource model resolves it against the same
   * workspace root this tree lists — the shipped tree's headline behaviour,
   * kept alongside the desktop openers.
   */
  const openPreview = (path: string): void => {
    tab.actions.openResource(sessionFileAddress(sessionId, path.replace(/\\/g, '/')))
  }

  const openers: SlotOpeners = {
    markdown: openerLabel(state, 'markdown'),
    code: openerLabel(state, 'code'),
    office: openerLabel(state, 'office'),
  }
  // No answer yet (or an explicit "configure nothing") keeps this plugin out of
  // the way: rows then do exactly what the shipped tree does.
  const passThrough = state === null || state.status !== 'ready'

  return (
    <div className={css.root}>
      <div className={css.body}>
        {cwd === undefined
          ? <div className={css.empty}>{t('tree.empty')}</div>
          : (
            <FileTree
              key={cwd}
              root={cwd}
              list={list}
              openPath={openPath}
              openInCode={openInCode}
              openInMarkdown={openInMarkdown}
              openInOffice={openInOffice}
              openers={openers}
              passThrough={passThrough}
              onConfigure={() => { setSetupOpen(true) }}
              openPreview={openPreview}
              t={t}
            />
          )}
      </div>
      {state?.status === 'off' && (
        <div className={css.notice}>
          <span className={css.noticeText}>{t('setup.offNotice')}</span>
          <button type="button" className={css.inlineButton} onClick={() => { setSetupOpen(true) }}>
            {t('setup.offReopen')}
          </button>
        </div>
      )}
      <SetupDialog
        open={setupOpen}
        state={state}
        t={t}
        scan={scanApps}
        save={saveState}
        onSaved={(stored) => { setState(stored); setSetupOpen(false) }}
        onClose={() => { setSetupOpen(false) }}
      />
    </div>
  )
}
