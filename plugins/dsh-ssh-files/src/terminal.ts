/**
 * The per-session terminal hub: one live remote PTY shell per session key,
 * with a bounded replay buffer and follower fan-out for the panel's NDJSON
 * stream. The shell outlives any single browser stream, so switching the
 * panel back to files (or reloading the page) re-attaches to the same remote
 * session with the buffered screen as the starting point.
 * @module @deepseek-ai/dsh-ssh-files/terminal
 */

import type { SshConnection, SshShell, SshTerminalSize } from './ssh.ts'

/** One line of the terminal stream (NDJSON on the wire). */
export type TerminalFrame =
  /** The replay buffer at attach time; the client resets its screen with it. */
  | { kind: 'snapshot'; data: string; trimmed: boolean }
  /** Live terminal output. */
  | { kind: 'data'; data: string }
  /** The remote shell ended (naturally, or because the connection dropped). */
  | { kind: 'exit'; code: number | null; signal: string | null }
  /** The channel failed outside a normal close. */
  | { kind: 'error'; message: string }
  /** Keep-alive; consumers ignore it. */
  | { kind: 'ping' }

/** One session's terminal runtime. */
interface TerminalRuntime {
  /** The live shell, or null when none is open (ended, closed, or never started). */
  shell: SshShell | null
  /** Recent output replayed to a new follower; the tail is kept when it overflows. */
  buffer: string
  /** Whether the buffer dropped older output (the replay starts mid-stream). */
  trimmed: boolean
  /** The last size any follower reported, reused when a shell is recreated. */
  size: SshTerminalSize
  /** Frames pushed to every attached stream. */
  readonly followers: Set<(frame: TerminalFrame) => void>
}

/** Default replay budget per session (characters). */
const DEFAULT_BUFFER_CHARS = 200_000

/**
 * Owns every session's remote shell. One instance lives for the host's
 * lifetime beside the session store whose connections it opens shells on.
 */
export class SshTerminalHub {
  private readonly sessions = new Map<string, TerminalRuntime>()

  /**
   * @param connectionFor - resolves a session key to its connected SSH
   *   connection; throwing there surfaces as the stream's failure frame.
   * @param bufferChars - replay budget per session (characters).
   */
  constructor(
    private readonly connectionFor: (sessionId: string) => SshConnection,
    private readonly bufferChars: number = DEFAULT_BUFFER_CHARS,
  ) {}

  /** The runtime for a session key (created lazily). */
  private runtimeFor(sessionId: string): TerminalRuntime {
    let runtime = this.sessions.get(sessionId)
    if (runtime === undefined) {
      runtime = {
        shell: null,
        buffer: '',
        trimmed: false,
        size: { cols: 80, rows: 24 },
        followers: new Set(),
      }
      this.sessions.set(sessionId, runtime)
    }
    return runtime
  }

  /**
   * Ensure the session has a live shell and return the replay buffer for a
   * new follower. The first attach opens the shell; a later attach reuses it,
   * and one after an exit starts a fresh shell (only once its output is known
   * to have ended for every follower).
   * @param sessionId - the session key owning the shell.
   * @param size - the attaching client's terminal size.
   * @returns the buffered output the client starts from.
   */
  async attach(sessionId: string, size: SshTerminalSize): Promise<{ snapshot: string; trimmed: boolean }> {
    const runtime = this.runtimeFor(sessionId)
    runtime.size = size
    if (runtime.shell === null || !runtime.shell.alive) {
      const connection = this.connectionFor(sessionId)
      runtime.buffer = ''
      runtime.trimmed = false
      runtime.shell = await connection.openShell(size, {
        onData: (text) => {
          this.append(runtime, text)
          this.broadcast(runtime, { kind: 'data', data: text })
        },
        onClose: (outcome) => {
          runtime.shell = null
          this.broadcast(runtime, { kind: 'exit', code: outcome.code, signal: outcome.signal })
        },
        onError: (error) => {
          this.broadcast(runtime, { kind: 'error', message: error.message })
        },
      })
    }
    return { snapshot: runtime.buffer, trimmed: runtime.trimmed }
  }

  /** Append output to the replay buffer, keeping the tail within the budget. */
  private append(runtime: TerminalRuntime, text: string): void {
    if (text.length === 0) return
    const combined = runtime.buffer + text
    if (combined.length <= this.bufferChars) {
      runtime.buffer = combined
      return
    }
    runtime.buffer = combined.slice(combined.length - this.bufferChars)
    runtime.trimmed = true
  }

  /** Push one frame to every attached stream. */
  private broadcast(runtime: TerminalRuntime, frame: TerminalFrame): void {
    for (const follower of [...runtime.followers]) {
      try {
        follower(frame)
      } catch {
        // A follower that throws is already unusable (its response is gone);
        // dropping it here keeps the remaining streams alive.
        runtime.followers.delete(follower)
      }
    }
  }

  /**
   * Attach one stream to a session's frames.
   * @param sessionId - the session key to follow.
   * @param listener - receives every frame from now on.
   * @returns the detach function (idempotent).
   */
  subscribe(sessionId: string, listener: (frame: TerminalFrame) => void): () => void {
    const runtime = this.runtimeFor(sessionId)
    runtime.followers.add(listener)
    return () => { runtime.followers.delete(listener) }
  }

  /** Send input to a session's live shell; a no-op when none is open. */
  write(sessionId: string, data: string): void {
    this.sessions.get(sessionId)?.shell?.write(data)
  }

  /** Report a client's terminal size; remembered for the next shell too. */
  resize(sessionId: string, size: SshTerminalSize): void {
    const runtime = this.runtimeFor(sessionId)
    runtime.size = size
    runtime.shell?.resize(size)
  }

  /** End a session's shell and drop its replay buffer. */
  close(sessionId: string): void {
    const runtime = this.sessions.get(sessionId)
    if (runtime === undefined) return
    const shell = runtime.shell
    runtime.shell = null
    runtime.buffer = ''
    runtime.trimmed = false
    shell?.close()
  }

  /** Stop the remote channel delivering data (HTTP backpressure). */
  pause(sessionId: string): void {
    this.sessions.get(sessionId)?.shell?.pause()
  }

  /** Resume a paused remote channel. */
  resume(sessionId: string): void {
    this.sessions.get(sessionId)?.shell?.resume()
  }

  /** End every shell (host teardown). */
  dispose(): void {
    for (const sessionId of [...this.sessions.keys()]) this.close(sessionId)
    this.sessions.clear()
  }
}
