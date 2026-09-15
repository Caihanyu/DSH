/**
 * SetupDialog: the first-run wizard. It asks whether the plugin may look for
 * the supported desktop applications, shows what a pass resolved, lets the user
 * enable each one and correct its launch path by hand, and persists the answer.
 * The dialog is the plugin's only configuration surface: whatever it stores is
 * what the tree's openers use, and an empty answer switches the plugin off
 * instead of guessing.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  ScanResult, WorkspaceFilesState, WorkspaceFilesTranslate,
} from './contract.ts'
import css from './WorkspaceFilesPanel.module.css'

/** One configurable application row. */
interface Row {
  /** Candidate identity (`typora`, `marktext`, `vscode`, `wps`). */
  id: string
  /** Display name. */
  label: string
  /** One-line role note under the name. */
  role: string
}

/** The applications the wizard offers, in the order it shows them. */
const ROWS: readonly Row[] = [
  { id: 'typora', label: 'Typora', role: '.md .markdown' },
  { id: 'marktext', label: 'MarkText', role: '.md .markdown' },
  { id: 'vscode', label: 'VS Code', role: '代码 / 文本文件' },
  { id: 'wps', label: 'WPS Office', role: '文档类文件' },
]

/** One row's editable state. */
interface RowState {
  /** Whether the plugin may use this application. */
  enabled: boolean
  /** Launch path (or PATH name) as typed. */
  path: string
  /** Whether a discovery pass resolved this path (drives the provenance note). */
  found: boolean
}

/** Steps the wizard moves through. */
type Step = 'ask' | 'scanning' | 'result'

/** Props the panel hands the wizard. */
export interface SetupDialogProps {
  /** Whether the dialog is showing. */
  open: boolean
  /** The state the panel last loaded, used to seed the rows. */
  state: WorkspaceFilesState | null
  /** Localized copy. */
  t: WorkspaceFilesTranslate
  /** Run one discovery pass (`deep` walks the drives). */
  scan: (deep: boolean, signal?: AbortSignal) => Promise<ScanResult>
  /** Persist an answer. */
  save: (state: WorkspaceFilesState) => Promise<WorkspaceFilesState>
  /** Called with the stored state once the answer is persisted. */
  onSaved: (state: WorkspaceFilesState) => void
  /** Called when the user dismisses the dialog without saving. */
  onClose: () => void
}

/** Seed one row from the stored state (a slot keeps whichever candidate it holds). */
function seedRow(id: string, state: WorkspaceFilesState | null): RowState {
  const slots = ['markdown', 'code', 'office'] as const
  for (const slot of slots) {
    const entry = state?.apps?.[slot]
    if (entry?.id === id) return { enabled: entry.enabled, path: entry.command, found: true }
  }
  return { enabled: false, path: '', found: false }
}

/** Whether a row is usable: enabled and carrying a path. */
function usable(row: RowState | undefined): row is RowState {
  return row !== undefined && row.enabled && row.path.trim() !== ''
}

/**
 * The first-run wizard.
 * @param props - open flag, the loaded state, the injected scan/save calls, and the close hooks.
 */
export function SetupDialog(props: SetupDialogProps) {
  const { open, state, t, scan, save, onSaved, onClose } = props
  const [step, setStep] = useState<Step>('ask')
  const [rows, setRows] = useState<Record<string, RowState>>(() => ({}))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [deep, setDeep] = useState(false)
  const [truncated, setTruncated] = useState('')
  const controller = useMemo(() => ({ current: null as AbortController | null }), [])

  // Every open starts from the stored answer again, so a cancelled wizard never
  // leaves half-typed paths for the next one.
  useEffect(() => {
    if (!open) return
    const seeded: Record<string, RowState> = {}
    for (const row of ROWS) seeded[row.id] = seedRow(row.id, state)
    setRows(seeded)
    setStep('ask')
    setError(null)
    setTruncated('')
    setBusy(false)
    setDeep(false)
  }, [open, state])

  const patch = (id: string, change: Partial<RowState>): void => {
    setRows(prev => ({ ...prev, [id]: { ...(prev[id] ?? { enabled: false, path: '', found: false }), ...change } }))
  }

  /** Run one discovery pass and fold its hits into the rows. */
  const runScan = async (walkDrives: boolean): Promise<void> => {
    const abort = new AbortController()
    controller.current = abort
    setStep('scanning')
    setError(null)
    setDeep(walkDrives)
    try {
      const result = await scan(walkDrives, abort.signal)
      setRows((prev) => {
        const next = { ...prev }
        for (const found of result.found) {
          next[found.id] = { enabled: true, path: found.command, found: true }
        }
        return next
      })
      setTruncated(result.truncated)
      setStep('result')
    } catch (reason) {
      if (abort.signal.aborted) {
        setStep('result')
        setTruncated('')
        return
      }
      setError(reason instanceof Error ? reason.message : String(reason))
      setStep('result')
    }
  }

  /** Build the state the current rows describe and persist it. */
  const commit = async (forceOff: boolean): Promise<void> => {
    setBusy(true)
    setError(null)
    const apps: WorkspaceFilesState['apps'] = {}
    if (!forceOff) {
      if (usable(rows.typora)) apps.markdown = { id: 'typora', label: 'Typora', command: rows.typora.path.trim(), enabled: true }
      else if (usable(rows.marktext)) apps.markdown = { id: 'marktext', label: 'MarkText', command: rows.marktext.path.trim(), enabled: true }
      if (usable(rows.vscode)) apps.code = { id: 'vscode', label: 'VS Code', command: rows.vscode.path.trim(), enabled: true }
      if (usable(rows.wps)) apps.office = { id: 'wps', label: 'WPS Office', command: rows.wps.path.trim(), enabled: true }
    }
    const next: WorkspaceFilesState = {
      version: 1,
      status: Object.keys(apps).length === 0 ? 'off' : 'ready',
      apps,
    }
    try {
      const stored = await save(next)
      setBusy(false)
      onSaved(stored)
    } catch (reason) {
      setBusy(false)
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }

  let body: ReactNode
  if (step === 'ask') {
    body = (
      <div className={css.setupBody}>
        <p className={css.setupQuestion}>{t('setup.ask')}</p>
        <p className={css.setupHint}>{t('setup.askHint')}</p>
      </div>
    )
  } else if (step === 'scanning') {
    body = (
      <div className={css.setupBody}>
        <p className={css.setupQuestion}>{deep ? t('setup.scanningDeep') : t('setup.scanning')}</p>
      </div>
    )
  } else {
    body = (
      <div className={css.setupBody}>
        <table className={css.setupTable}>
          <tbody>
            {ROWS.map((row) => {
              const value = rows[row.id] ?? { enabled: false, path: '', found: false }
              return (
                <tr key={row.id}>
                  <td className={css.setupCheckCell}>
                    <input
                      type="checkbox"
                      checked={value.enabled}
                      aria-label={`${t('setup.use')} ${row.label}`}
                      onChange={(event) => { patch(row.id, { enabled: event.target.checked }) }}
                    />
                  </td>
                  <td className={css.setupNameCell}>
                    <div className={css.setupName}>{row.label}</div>
                    <div className={css.setupRole}>{row.role}</div>
                  </td>
                  <td>
                    <input
                      type="text"
                      className={css.setupInput}
                      value={value.path}
                      placeholder={t('setup.placeholder')}
                      aria-label={`${row.label} ${t('setup.path')}`}
                      onChange={(event) => { patch(row.id, { path: event.target.value, found: false }) }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {truncated !== '' && <p className={css.setupWarn}>{t('setup.truncated', { reason: truncated })}</p>}
        <p className={css.setupHint}>{t('setup.note.markdown')}</p>
        <p className={css.setupHint}>{t('setup.note.office')}</p>
        <p className={css.setupHint}>{t('setup.note.off')}</p>
      </div>
    )
  }

  const footer = (() => {
    if (step === 'ask') {
      return (
        <div className={css.setupFooter}>
          <Button variant="outline" onClick={() => { void commit(true) }} disabled={busy}>{t('setup.decline')}</Button>
          <Button variant="outline" onClick={() => { setStep('result') }} disabled={busy}>{t('setup.manual')}</Button>
          <Button onClick={() => { void runScan(false) }} disabled={busy}>{t('setup.scan')}</Button>
        </div>
      )
    }
    if (step === 'scanning') {
      return (
        <div className={css.setupFooter}>
          <Button
            variant="outline"
            onClick={() => { controller.current?.abort() }}
          >
            {t('setup.cancel')}
          </Button>
        </div>
      )
    }
    return (
      <div className={css.setupFooter}>
        <Button variant="outline" onClick={() => { void commit(true) }} disabled={busy}>{t('setup.decline')}</Button>
        <Button variant="outline" onClick={() => { void runScan(true) }} disabled={busy}>{t('setup.scanDeep')}</Button>
        <Button onClick={() => { void commit(false) }} disabled={busy}>{busy ? t('setup.saving') : t('setup.save')}</Button>
      </div>
    )
  })()

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel={t('setup.cancel')}
      title={t('setup.title')}
      footer={footer}
    >
      {error !== null && <p className={css.setupError}>{t('setup.error', { message: error })}</p>}
      {body}
    </Modal>
  )
}
