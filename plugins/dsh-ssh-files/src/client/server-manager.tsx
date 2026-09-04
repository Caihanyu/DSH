/**
 * ServerManager: two modals — the server list (edit / delete / add) and the
 * add-or-edit form. The form collects name, host, port, username,
 * authentication strategy (password / private key / agent), and the initial
 * directory; the host validates and persists records.
 */

import { useMemo, useState } from 'react'
import {
  Button, IconEditOutline16, IconGlobeOutline14, IconPlusOutline16,
  IconTrashOutline16, Input, Menu, Modal, Pill,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { SshAuth, SshFilesTranslate, SshServer, SshServerInput } from './contract.ts'
import css from './SshFilesPanel.module.css'

/** Props the server manager needs. */
export interface ServerManagerProps {
  /** Whether the modal is open. */
  open: boolean
  /** Close the manager (the form modal owns its own state). */
  onClose: () => void
  /** Saved server records. */
  servers: SshServer[]
  /** The id of the server the panel is connected to (or null). */
  activeServerId: string | null
  /** Add a server record. */
  addServer: (input: SshServerInput) => Promise<void>
  /** Replace one server record's fields. */
  updateServer: (id: string, input: SshServerInput) => Promise<void>
  /** Remove one server record. */
  removeServer: (id: string) => Promise<void>
  /** Localized copy. */
  t: SshFilesTranslate
}

/** One draft of the form fields, with an error message per field. */
interface Draft {
  name: string
  host: string
  port: string
  username: string
  auth: SshAuth
  password: string
  keyPath: string
  root: string
}

/** A fresh empty draft. */
function emptyDraft(): Draft {
  return { name: '', host: '', port: '22', username: '', auth: 'password', password: '', keyPath: '', root: '' }
}

/** Draft from an existing record (for editing). */
function draftFromServer(server: SshServer): Draft {
  return {
    name: server.name,
    host: server.host,
    port: String(server.port),
    username: server.username,
    auth: server.auth,
    password: server.password ?? '',
    keyPath: server.keyPath ?? '',
    root: server.root,
  }
}

/** The add-or-edit form modal. */
function ServerFormModal({
  initial, title, onSave, onCancel, t,
}: {
  initial: Draft
  title: string
  onSave: (input: SshServerInput) => Promise<void>
  onCancel: () => void
  t: SshFilesTranslate
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [authMenu, setAuthMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof Draft, value: string): void => {
    setDraft(current => ({ ...current, [key]: value }))
  }

  const authLabel = useMemo(() => {
    switch (draft.auth) {
      case 'password': return t('form.authPassword')
      case 'key': return t('form.authKey')
      case 'agent': return t('form.authAgent')
    }
  }, [draft.auth, t])

  const submit = async (): Promise<void> => {
    const port = Number.parseInt(draft.port, 10)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      setError(t('form.invalidPort'))
      return
    }
    const input: SshServerInput = {
      name: draft.name.trim(),
      host: draft.host.trim(),
      port,
      username: draft.username.trim(),
      auth: draft.auth,
      root: draft.root.trim(),
    }
    if (draft.auth === 'password' && draft.password !== '') input.password = draft.password
    if (draft.auth === 'key' && draft.keyPath.trim() !== '') input.keyPath = draft.keyPath.trim()
    setBusy(true)
    setError(null)
    try {
      await onSave(input)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onCancel}
      closeLabel={t('form.cancel')}
      title={title}
      footer={(
        <>
          <Button variant="outline" onClick={onCancel}>{t('form.cancel')}</Button>
          <Button variant="primary" disabled={busy} onClick={() => { void submit() }}>
            {t('form.save')}
          </Button>
        </>
      )}
    >
      <div className={css.formGrid}>
        <label className={css.formField}>
          <span className={css.formLabel}>{t('form.name')}</span>
          <Input
            value={draft.name}
            placeholder={t('form.namePlaceholder')}
            onChange={event => { set('name', event.target.value) }}
          />
        </label>
        <label className={css.formField}>
          <span className={css.formLabel}>{t('form.host')}</span>
          <Input
            value={draft.host}
            placeholder={t('form.hostPlaceholder')}
            onChange={event => { set('host', event.target.value) }}
          />
        </label>
        <div className={css.formRow}>
          <label className={css.formField}>
            <span className={css.formLabel}>{t('form.port')}</span>
            <Input
              value={draft.port}
              inputMode="numeric"
              onChange={event => { set('port', event.target.value) }}
            />
          </label>
          <label className={css.formField}>
            <span className={css.formLabel}>{t('form.username')}</span>
            <Input
              value={draft.username}
              onChange={event => { set('username', event.target.value) }}
            />
          </label>
        </div>
        <label className={css.formField}>
          <span className={css.formLabel}>{t('form.auth')}</span>
          <Menu
            open={authMenu}
            onClose={() => { setAuthMenu(false) }}
            items={[
              { id: 'password', label: t('form.authPassword') },
              { id: 'key', label: t('form.authKey') },
              { id: 'agent', label: t('form.authAgent') },
            ]}
            selectedId={draft.auth}
            onSelect={(id) => {
              setAuthMenu(false)
              setDraft(current => ({ ...current, auth: id as SshAuth }))
            }}
            align="end"
            portal
            anchor={(
              <button type="button" className={css.authSelect} onClick={() => { setAuthMenu(true) }}>
                {authLabel}
              </button>
            )}
          />
        </label>
        {draft.auth === 'password' && (
          <label className={css.formField}>
            <span className={css.formLabel}>{t('form.password')}</span>
            <Input
              type="password"
              value={draft.password}
              placeholder={t('form.passwordPlaceholder')}
              onChange={event => { set('password', event.target.value) }}
            />
          </label>
        )}
        {draft.auth === 'key' && (
          <label className={css.formField}>
            <span className={css.formLabel}>{t('form.keyPath')}</span>
            <Input
              value={draft.keyPath}
              placeholder={t('form.keyPathPlaceholder')}
              onChange={event => { set('keyPath', event.target.value) }}
            />
          </label>
        )}
        <label className={css.formField}>
          <span className={css.formLabel}>{t('form.root')}</span>
          <Input
            value={draft.root}
            placeholder={t('form.rootPlaceholder')}
            onChange={event => { set('root', event.target.value) }}
          />
        </label>
        {error !== null && <div className={css.formError} role="alert">{error}</div>}
      </div>
    </Modal>
  )
}

/** The server list manager with add/edit/delete. */
export function ServerManager({
  open, onClose, servers, activeServerId, addServer, updateServer, removeServer, t,
}: ServerManagerProps) {
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startAdd = (): void => {
    setError(null)
    setEditing({ id: null, draft: emptyDraft() })
  }

  const startEdit = (server: SshServer): void => {
    setError(null)
    setEditing({ id: server.id, draft: draftFromServer(server) })
  }

  const handleSave = async (input: SshServerInput): Promise<void> => {
    if (editing === null) return
    if (editing.id === null) {
      await addServer(input)
    } else {
      await updateServer(editing.id, input)
    }
    setEditing(null)
  }

  const handleDelete = async (server: SshServer): Promise<void> => {
    const confirmed = window.confirm(t('manage.deleteConfirm', { name: server.name }))
    if (!confirmed) return
    setBusyId(server.id)
    setError(null)
    try {
      await removeServer(server.id)
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <Modal
        open={open && editing === null}
        onClose={onClose}
        closeLabel={t('form.cancel')}
        title={t('manage.title')}
        footer={(
          <Button variant="primary" icon={<IconPlusOutline16 />} onClick={startAdd}>
            {t('manage.add')}
          </Button>
        )}
      >
        {error !== null && <div className={css.formError} role="alert">{error}</div>}
        {servers.length === 0 && <div className={css.empty}>{t('manage.empty')}</div>}
        <div className={css.serverList}>
          {servers.map(server => (
            <div key={server.id} className={css.serverRow}>
              <div className={css.serverInfo}>
                <IconGlobeOutline14 className={css.serverIcon} />
                <div className={css.serverText}>
                  <div className={css.serverName}>
                    {server.name}
                    {server.id === activeServerId && (
                      <Pill active className={css.connectedPill}>{t('conn.connected')}</Pill>
                    )}
                  </div>
                  <div className={css.serverMeta}>
                    {server.username}@{server.host}:{server.port}
                  </div>
                </div>
              </div>
              <div className={css.serverActions}>
                <button
                  type="button"
                  className={css.iconButton}
                  aria-label={t('manage.edit')}
                  title={t('manage.edit')}
                  onClick={() => { startEdit(server) }}
                >
                  <IconEditOutline16 />
                </button>
                <button
                  type="button"
                  className={css.iconButton}
                  aria-label={t('manage.delete')}
                  title={t('manage.delete')}
                  disabled={busyId === server.id}
                  onClick={() => { void handleDelete(server) }}
                >
                  <IconTrashOutline16 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      {editing !== null && (
        <ServerFormModal
          initial={editing.draft}
          title={editing.id === null ? t('form.titleAdd') : t('form.titleEdit')}
          onSave={handleSave}
          onCancel={() => { setEditing(null) }}
          t={t}
        />
      )}
    </>
  )
}
