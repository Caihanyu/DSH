/**
 * FileEditor: the panel's read/write editor for one text file on the active
 * filesystem. Loads the content through the injected `read`, edits in a
 * plain textarea, and persists through `write` (temp + rename on the host).
 * A dirty close asks for confirmation instead of discarding silently.
 */

import { useEffect, useState } from 'react'
import { Button, IconCheckOutline16, IconCloseOutline16, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SshFilesTranslate } from './contract.ts'
import css from './SshFilesPanel.module.css'

/** Props the panel passes to the editor. */
export interface FileEditorProps {
  /** Absolute path of the file being edited. */
  path: string
  /** Read one text file on the active filesystem. */
  read: (path: string, signal?: AbortSignal) => Promise<string>
  /** Write one text file on the active filesystem. */
  write: (path: string, content: string) => Promise<void>
  /** Close the editor (the panel owns dirty confirmation via the host). */
  onClose: () => void
  /** Localized copy. */
  t: SshFilesTranslate
}

/** The editor. */
export function FileEditor({ path, read, write, onClose, t }: FileEditorProps) {
  const [content, setContent] = useState<string | null>(null)
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [readError, setReadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setReadError(null)
    read(path, controller.signal).then(
      (text) => {
        setContent(text)
        setOriginal(text)
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setReadError(error instanceof Error ? error.message : String(error))
      },
    ).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => { controller.abort() }
  }, [path, read])

  const dirty = content !== null && content !== original

  const requestClose = (): void => {
    if (dirty) {
      setConfirmClose(true)
    } else {
      onClose()
    }
  }

  const save = async (): Promise<void> => {
    if (content === null || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      await write(path, content)
      setOriginal(content)
      setSavedFlash(true)
      window.setTimeout(() => { setSavedFlash(false) }, 1500)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={css.editorRoot}>
      <header className={css.editorHeader}>
        <div className={css.editorPath} title={path}>{path}</div>
        <div className={css.editorActions}>
          {dirty && <span className={css.editorDirty}>{t('editor.dirty')}</span>}
          <Button
            variant="primary"
            size="sm"
            icon={<IconCheckOutline16 />}
            disabled={content === null || saving || !dirty}
            onClick={() => { void save() }}
          >
            {saving ? t('editor.saving') : t('editor.save')}
          </Button>
          <button
            type="button"
            className={css.iconButton}
            aria-label={t('editor.close')}
            title={t('editor.close')}
            onClick={requestClose}
          >
            <IconCloseOutline16 />
          </button>
        </div>
      </header>
      {loading && <div className={css.editorStatus}>{t('editor.loading')}</div>}
      {readError !== null && (
        <div className={css.editorError} role="alert">
          {t('editor.readFailed', { message: readError })}
        </div>
      )}
      {content !== null && (
        <textarea
          className={css.editorTextarea}
          value={content}
          spellCheck={false}
          onChange={event => { setContent(event.target.value) }}
          aria-label={path}
        />
      )}
      {saveError !== null && (
        <div className={css.editorError} role="alert">
          {t('editor.saveFailed', { message: saveError })}
        </div>
      )}
      {savedFlash && <div className={css.editorSaved}>{t('editor.saved')}</div>}
      <Modal
        open={confirmClose}
        onClose={() => { setConfirmClose(false) }}
        closeLabel={t('form.cancel')}
        title={t('editor.unsaved')}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setConfirmClose(false) }}>{t('form.cancel')}</Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmClose(false)
                onClose()
              }}
            >
              {t('editor.close')}
            </Button>
          </>
        )}
      />
    </div>
  )
}
