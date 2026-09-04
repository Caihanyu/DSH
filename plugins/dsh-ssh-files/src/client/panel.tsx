/**
 * SshFilesPanel: the details-column occupant this plugin registers. The panel
 * shows and drives the state of the conversation it is mounted on — its
 * working mode (local / SSH), its remembered server, and its own live
 * connection — so separate conversations never share a server preference or
 * channel. It browses the active filesystem in a lazy tree and reads/writes
 * text files in a built-in editor. The panel auto-opens the column is not its
 * job: ui-conversation's inspect gesture opens it, and this plugin's own
 * registration wins the column the moment it is open.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button, IconCloseOutline16, IconPlusOutline16, IconSettingsOutline14,
  IconWarningOutline16, Input, Menu, Modal, StateDot,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SshFileEntry, SshFilesPanelProps, SshStateResponse } from './contract.ts'
import { FileEditor } from './file-editor.tsx'
import { FileTree } from './file-tree.tsx'
import { ServerManager } from './server-manager.tsx'
import css from './SshFilesPanel.module.css'

/** Join a directory and a name with `/` (Node fs and SFTP both accept `/` on every platform). */
function joinPath(dir: string, name: string): string {
  return dir.endsWith('/') || dir.endsWith('\\') ? dir + name : `${dir}/${name}`
}

/** The details panel. */
export function SshFilesPanel(props: SshFilesPanelProps) {
  const {
    useSessions, sessionId: sid, t,
    openDetails, closeDetails,
    getState, setMode, addServer, updateServer, removeServer, connect, disconnect,
    list, read, write, mkdir, unlink, openNewSessionOn,
    openLocalDefault, openLocalCode, openLocalMarktext,
  } = props
  // Session workspace root: the local tree's base. An omitted cwd (blank
  // session) renders the empty state rather than a fabricated root.
  const cwd = useSessions(store => store.byId[sid]?.cwd)

  const [response, setResponse] = useState<SshStateResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [serverMenuOpen, setServerMenuOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [openFile, setOpenFile] = useState<string | null>(null)
  const [createTarget, setCreateTarget] = useState<{ dirPath: string; kind: 'file' | 'dir' } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SshFileEntry | null>(null)
  const [newName, setNewName] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // The column opens for the session that mounts this panel.
  useEffect(() => { openDetails() }, [openDetails])

  // Initial state load (abort-guarded) for THIS session.
  useEffect(() => {
    const controller = new AbortController()
    setLoadError(null)
    getState(sid, controller.signal).then(
      setResponse,
      (error: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(error instanceof Error ? error.message : String(error))
      },
    )
    return () => { controller.abort() }
  }, [getState, sid])

  const mode = response?.state.mode ?? 'local'
  const connected = response?.state.connected ?? false
  const activeServer = useMemo(
    () => response?.state.servers.find(server => server.id === response.state.serverId) ?? null,
    [response],
  )
  const selectedServer = useMemo(
    () => response?.state.servers.find(server => server.id === (selectedId ?? response.state.serverId)) ?? null,
    [response, selectedId],
  )

  /** Tree base: session cwd in local mode, the server root when connected. */
  const localRoot = cwd
  const sshRoot = response?.root ?? null

  const handleSetMode = async (next: 'local' | 'ssh'): Promise<void> => {
    if (next === mode) return
    setOpenFile(null)
    setConnectError(null)
    try {
      setResponse(await setMode(sid, next))
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error))
    }
  }

  // Auto-reconnect once per mount: an SSH-mode session whose remembered server
  // is present reconnects without a click, so a new conversation opened on a
  // server arrives connected. A manual disconnect leaves it disconnected.
  const autoConnectTried = useRef(false)
  useEffect(() => {
    if (autoConnectTried.current) return
    if (response === null || loadError !== null) return
    const st = response.state
    if (st.mode !== 'ssh' || st.serverId === null || st.connected) return
    if (st.servers.find(candidate => candidate.id === st.serverId) === undefined) return
    autoConnectTried.current = true
    setConnectingId(st.serverId)
    void connect(sid, st.serverId).then(
      setResponse,
      (error: unknown) => {
        autoConnectTried.current = false
        setConnectError(error instanceof Error ? error.message : String(error))
      },
    ).finally(() => { setConnectingId(null) })
  }, [response, loadError, connect])

  const handleConnect = async (id: string): Promise<void> => {
    setConnectingId(id)
    setConnectError(null)
    setOpenFile(null)
    try {
      setResponse(await connect(sid, id))
      setSelectedId(id)
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error))
    } finally {
      setConnectingId(null)
    }
  }

  const handleDisconnect = async (): Promise<void> => {
    setOpenFile(null)
    setConnectError(null)
    try {
      setResponse(await disconnect(sid))
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error))
    }
  }

  /** Open the current workspace's New-Session view defaulted to this server. */
  const handleNewSessionOn = async (serverId: string): Promise<void> => {
    setConnectError(null)
    try {
      await openNewSessionOn(serverId)
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : String(error))
    }
  }

  const handleCreate = async (): Promise<void> => {
    if (createTarget === null) return
    const name = newName.trim()
    if (name === '') return
    const target = joinPath(createTarget.dirPath, name)
    setCreateBusy(true)
    setCreateError(null)
    try {
      if (createTarget.kind === 'file') {
        await write(sid, target, '')
      } else {
        await mkdir(sid, target)
      }
      setCreateTarget(null)
      setNewName('')
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : String(error))
    } finally {
      setCreateBusy(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (deleteTarget === null) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await unlink(sid, deleteTarget.path)
      setDeleteTarget(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error))
    } finally {
      setDeleteBusy(false)
    }
  }

  const openLocalAction = (app: 'code' | 'marktext' | 'default'): ((path: string) => Promise<void>) =>
    app === 'code'
      ? openLocalCode
      : app === 'marktext' ? openLocalMarktext : openLocalDefault

  /** FileTree's per-row opener: choose the app from the row menu's id. */
  const handleOpenLocal = (path: string, app: 'code' | 'marktext' | 'default'): Promise<void> =>
    openLocalAction(app)(path)

  const serverMenuItems = (response?.state.servers ?? []).map(server => ({
    id: server.id,
    label: `${server.name}（${server.username}@${server.host}）`,
  }))

  return (
    <div className={css.root}>
      <header className={css.header}>
        <div className={css.modeBar} role="tablist" aria-label={t('mode.tip')}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'local'}
            className={mode === 'local' ? `${css.modeTab} ${css.modeTabActive}` : css.modeTab}
            onClick={() => { void handleSetMode('local') }}
          >
            {t('mode.local')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'ssh'}
            className={mode === 'ssh' ? `${css.modeTab} ${css.modeTabActive}` : css.modeTab}
            onClick={() => { void handleSetMode('ssh') }}
          >
            {t('mode.ssh')}
          </button>
        </div>
        {mode === 'ssh' && (
          <div className={css.connBar}>
            {connected && activeServer !== null ? (
              <>
                <span className={css.connInfo}>
                  <StateDot state="done" />
                  {t('conn.connectedTo', { name: activeServer.name })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<IconPlusOutline16 />}
                  title={t('conn.newSessionOn')}
                  onClick={() => { void handleNewSessionOn(activeServer.id) }}
                >
                  {t('conn.newSessionOn')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { void handleDisconnect() }}>
                  {t('conn.disconnect')}
                </Button>
              </>
            ) : (
              <>
                <Menu
                  open={serverMenuOpen}
                  onClose={() => { setServerMenuOpen(false) }}
                  items={serverMenuItems}
                  selectedId={selectedServer?.id}
                  onSelect={(id) => {
                    setServerMenuOpen(false)
                    setSelectedId(id)
                  }}
                  align="end"
                  portal
                  anchor={(
                    <button type="button" className={css.serverSelect} onClick={() => { setServerMenuOpen(true) }}>
                      {selectedServer?.name ?? t('conn.select')}
                    </button>
                  )}
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedServer === null || connectingId !== null}
                  onClick={() => { if (selectedServer !== null) void handleConnect(selectedServer.id) }}
                >
                  {connectingId !== null ? t('conn.connecting') : t('conn.connect')}
                </Button>
              </>
            )}
            <button
              type="button"
              className={css.iconButton}
              aria-label={t('conn.manage')}
              title={t('conn.manage')}
              onClick={() => { setManageOpen(true) }}
            >
              <IconSettingsOutline14 />
            </button>
          </div>
        )}
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
        {loadError !== null && (
          <div className={css.empty}>
            <IconWarningOutline16 />
            <span>{loadError}</span>
          </div>
        )}
        {loadError === null && response === null && <div className={css.empty}>{t('tree.loading')}</div>}
        {connectError !== null && (
          <div className={css.errorText} role="alert">{t('conn.failed', { message: connectError })}</div>
        )}
        {response !== null && loadError === null && openFile === null && mode === 'local' && (
          localRoot === undefined
            ? <div className={css.empty}>{t('tree.empty')}</div>
            : (
              <FileTree
                key={`local-${localRoot}`}
                root={localRoot}
                list={(path, signal) => list(sid, path, signal)}
                mode="local"
                onOpenFile={setOpenFile}
                onCreate={(dirPath, kind) => { setCreateTarget({ dirPath, kind }); setNewName(''); setCreateError(null) }}
                onDelete={setDeleteTarget}
                onOpenLocal={handleOpenLocal}
                t={t}
              />
            )
        )}
        {response !== null && loadError === null && openFile === null && mode === 'ssh' && (
          connected && sshRoot !== null
            ? (
              <FileTree
                key={`ssh-${sshRoot}`}
                root={sshRoot}
                list={(path, signal) => list(sid, path, signal)}
                mode="ssh"
                onOpenFile={setOpenFile}
                onCreate={(dirPath, kind) => { setCreateTarget({ dirPath, kind }); setNewName(''); setCreateError(null) }}
                onDelete={setDeleteTarget}
                onOpenLocal={handleOpenLocal}
                t={t}
              />
            )
            : (
              <div className={css.empty}>
                {response.state.servers.length === 0
                  ? <span>{t('conn.empty')}</span>
                  : <span>{t('conn.notConnected')}</span>}
              </div>
            )
        )}
        {openFile !== null && (
          <FileEditor
            path={openFile}
            read={(path, signal) => read(sid, path, signal)}
            write={(path, content) => write(sid, path, content)}
            onClose={() => { setOpenFile(null) }}
            t={t}
          />
        )}
      </div>
      <ServerManager
        open={manageOpen}
        onClose={() => { setManageOpen(false) }}
        servers={response?.state.servers ?? []}
        activeServerId={response?.state.serverId ?? null}
        addServer={async (input) => { setResponse(await addServer(sid, input)) }}
        updateServer={async (id, input) => { setResponse(await updateServer(sid, id, input)) }}
        removeServer={async (id) => { setResponse(await removeServer(sid, id)) }}
        t={t}
      />
      <Modal
        open={createTarget !== null}
        onClose={() => { setCreateTarget(null) }}
        closeLabel={t('form.cancel')}
        title={createTarget?.kind === 'file' ? t('tree.newFile') : t('tree.newDir')}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setCreateTarget(null) }}>{t('form.cancel')}</Button>
            <Button variant="primary" disabled={createBusy || newName.trim() === ''} onClick={() => { void handleCreate() }}>
              {t('tree.create')}
            </Button>
          </>
        )}
      >
        {createTarget !== null && <div className={css.createDir}>{createTarget.dirPath}</div>}
        <Input
          value={newName}
          placeholder={t('tree.newNamePlaceholder')}
          onChange={event => { setNewName(event.target.value) }}
          onKeyDown={event => {
            if (event.key === 'Enter' && newName.trim() !== '') void handleCreate()
          }}
        />
        {createError !== null && <div className={css.errorText} role="alert">{createError}</div>}
      </Modal>
      <Modal
        open={deleteTarget !== null}
        onClose={() => { setDeleteTarget(null) }}
        closeLabel={t('form.cancel')}
        title={t('tree.delete')}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setDeleteTarget(null) }}>{t('form.cancel')}</Button>
            <Button variant="primary" disabled={deleteBusy} onClick={() => { void handleDelete() }}>
              {t('tree.delete')}
            </Button>
          </>
        )}
      >
        <div className={css.deleteText}>
          {deleteTarget !== null && t('tree.deleteConfirm', { name: deleteTarget.name })}
        </div>
        {deleteError !== null && <div className={css.errorText} role="alert">{deleteError}</div>}
      </Modal>
    </div>
  )
}
