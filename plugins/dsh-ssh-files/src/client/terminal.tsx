/**
 * The SSH terminal view: one xterm instance bound to the session's remote PTY
 * shell, dressed like the shipped terminal pane (ui-sidebar-terminal): the
 * primitives' monospace stack at the content size, and an emulator theme read
 * from the pane's own resolved colours, so light and dark themes follow the
 * application instead of a fixed palette.
 *
 * The shell lives on the host and outlives this component, so switching the
 * panel back to files (or reloading the page) re-attaches to the same remote
 * session from its replay buffer.
 *
 * The stream is one long-lived NDJSON response off the plugin's own route:
 * `snapshot` resets the screen from the replay buffer, `data` appends live
 * output, and `exit` / `error` end the session with a notice.
 */

import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  SshFilesInjected, SshFilesTranslate, SshTerminalFrame, SshTerminalSize,
} from './contract.ts'
import '@xterm/xterm/css/xterm.css'
import css from './SshFilesPanel.module.css'

/** Connection state of this view's stream (not of the SSH session itself). */
type TerminalStatus = 'connecting' | 'open' | 'closed'

/** What the terminal needs from the panel. */
export interface SshTerminalViewProps {
  sessionId: string
  /** Whether the session's SSH connection is up; without it there is no shell. */
  connected: boolean
  t: SshFilesTranslate
  terminalStreamUrl: SshFilesInjected['terminalStreamUrl']
  writeTerminal: SshFilesInjected['writeTerminal']
  resizeTerminal: SshFilesInjected['resizeTerminal']
  closeTerminal: SshFilesInjected['closeTerminal']
}

/** Parse one NDJSON line into a frame; null for keep-alives and malformed lines. */
function parseFrame(line: string): SshTerminalFrame | null {
  const text = line.trim()
  if (text === '') return null
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  switch (record.kind) {
    case 'snapshot':
      return typeof record.data === 'string'
        ? { kind: 'snapshot', data: record.data, trimmed: record.trimmed === true }
        : null
    case 'data':
      return typeof record.data === 'string' ? { kind: 'data', data: record.data } : null
    case 'exit':
      return {
        kind: 'exit',
        code: typeof record.code === 'number' ? record.code : null,
        signal: typeof record.signal === 'string' ? record.signal : null,
      }
    case 'error':
      return { kind: 'error', message: typeof record.message === 'string' ? record.message : 'terminal failed' }
    default:
      return null
  }
}

/** The panel's terminal view. */
export function SshTerminalView(props: SshTerminalViewProps) {
  const { sessionId, connected, t, terminalStreamUrl, writeTerminal, resizeTerminal, closeTerminal } = props
  const screenRef = useRef<HTMLDivElement | null>(null)
  const termRef = useRef<Terminal | null>(null)
  const [status, setStatus] = useState<TerminalStatus>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const screen = screenRef.current
    if (screen === null || !connected) return
    setStatus('connecting')
    setError(null)

    // The shipped terminal pane's emulator setup (ui-sidebar-terminal
    // TerminalBody): same face, size, contrast floor, and scrollback.
    const term = new Terminal({
      minimumContrastRatio: 4.5,
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      scrollback: 5000,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(screen)
    term.textarea?.setAttribute('aria-label', t('view.terminal'))
    termRef.current = term

    /** Paint the emulator with the pane's resolved colours (theme-following). */
    const applyTheme = (): void => {
      const element = screenRef.current
      if (element === null) return
      const style = getComputedStyle(element)
      const background = style.backgroundColor
      const foreground = style.color
      term.options.theme = {
        background,
        foreground,
        cursor: foreground,
        cursorAccent: background,
        selectionBackground: foreground,
        selectionForeground: background,
      }
    }
    applyTheme()
    // The application marks dark mode on the body and follows the system
    // preference itself, so watch both rather than guessing from a media query.
    const themeObserver = new MutationObserver(applyTheme)
    themeObserver.observe(document.body, { attributes: true })
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyTheme)

    try {
      fit.fit()
    } catch { /* the host has no measurable size yet; the observer refits */ }

    const controller = new AbortController()
    let disposed = false
    let ready = false

    // Input and size changes go out over the route's POST endpoints; the
    // stream only carries output.
    const input = term.onData((data) => {
      void writeTerminal(sessionId, data).catch(() => { /* the stream reports the failure */ })
    })
    const resize = term.onResize(({ cols, rows }: SshTerminalSize) => {
      if (!ready) return
      void resizeTerminal(sessionId, { cols, rows }).catch(() => { /* ignored */ })
    })

    const applyFrame = (frame: SshTerminalFrame): void => {
      switch (frame.kind) {
        case 'snapshot':
          term.reset()
          if (frame.data !== '') term.write(frame.data)
          ready = true
          setStatus('open')
          break
        case 'data':
          term.write(frame.data)
          break
        case 'exit':
          term.write(`\r\n\x1b[33m${t('term.ended')}\x1b[0m\r\n`)
          setStatus('closed')
          break
        case 'error':
          setError(frame.message)
          setStatus('closed')
          break
      }
    }

    const run = async (): Promise<void> => {
      const response = await fetch(
        terminalStreamUrl(sessionId, { cols: term.cols, rows: term.rows }),
        { signal: controller.signal },
      )
      if (!response.ok) {
        const body = await response.text().catch(() => '')
        let message = `HTTP ${String(response.status)}`
        try {
          const parsed = JSON.parse(body) as { error?: { message?: unknown } }
          if (typeof parsed.error?.message === 'string') message = parsed.error.message
        } catch { /* a non-JSON body keeps the status text */ }
        throw new Error(message)
      }
      const reader = response.body?.getReader()
      if (reader === undefined) throw new Error('terminal stream has no body')
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let newline = buffer.indexOf('\n')
        while (newline >= 0) {
          const frame = parseFrame(buffer.slice(0, newline))
          buffer = buffer.slice(newline + 1)
          if (frame !== null) applyFrame(frame)
          newline = buffer.indexOf('\n')
        }
      }
      if (!disposed) setStatus(current => (current === 'open' ? 'closed' : current))
    }

    void run().catch((caught: unknown) => {
      if (disposed || controller.signal.aborted) return
      setError(caught instanceof Error ? caught.message : String(caught))
      setStatus('closed')
    })

    const observer = new ResizeObserver(() => {
      try {
        fit.fit()
      } catch { /* transient layout states */ }
    })
    observer.observe(screen)

    return () => {
      disposed = true
      controller.abort()
      observer.disconnect()
      themeObserver.disconnect()
      media.removeEventListener('change', applyTheme)
      input.dispose()
      resize.dispose()
      term.dispose()
      termRef.current = null
    }
  }, [attempt, connected, resizeTerminal, sessionId, t, terminalStreamUrl, writeTerminal])

  if (!connected) {
    return (
      <div className={css.terminalPane}>
        <div className={css.empty}>{t('term.needConnection')}</div>
      </div>
    )
  }

  return (
    <div className={css.terminalPane}>
      <div className={css.terminalBar}>
        <span className={css.terminalStatus}>
          {status === 'open' ? t('term.open') : status === 'connecting' ? t('term.connecting') : t('term.closed')}
        </span>
        <span className={css.terminalSpacer} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setAttempt(current => current + 1) }}
        >
          {t('term.reconnect')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => { termRef.current?.clear() }}>
          {t('term.clear')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void closeTerminal(sessionId)
              .then(() => { setStatus('closed') })
              .catch((caught: unknown) => { setError(caught instanceof Error ? caught.message : String(caught)) })
          }}
        >
          {t('term.close')}
        </Button>
      </div>
      {error !== null && <div className={css.errorText} role="alert">{t('term.failed', { message: error })}</div>}
      <div className={css.terminalScreen} ref={screenRef} />
    </div>
  )
}
