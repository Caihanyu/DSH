/**
 * ToolDetails: the "tools" tab inspector. Reads the conversation snapshot
 * directly — the shared chat-store selection belongs to ui-conversation,
 * whose DetailsPanel this plugin shadows — and lists every tool call
 * materialized in the current window. Selecting one shows its input and
 * output; output renders as plain text/JSON (the tool-specific
 * `conversation.details.tool` renderers stay bound to the shadowed
 * DetailsPanel's declaration, so they are not re-rendered here).
 */

import { useMemo, useState } from 'react'
import { CodeBlock } from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  ConversationSnapshot, ToolCallBlock, ToolResultNode, UseConversationSession,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { WorkspaceFilesTranslate } from './contract.ts'
import css from './WorkspaceFilesPanel.module.css'

/** Props the panel passes to the tools inspector. */
export interface ToolDetailsProps {
  /** Session-scope conversation selector hook (framework standard kit). */
  useSession: UseConversationSession
  /** Localized copy. */
  t: WorkspaceFilesTranslate
}

/** Collect every root tool call materialized in the current window. */
function collectToolCalls(snapshot: ConversationSnapshot): ToolCallBlock[] {
  const out: ToolCallBlock[] = []
  for (const node of snapshot.chat.nodes.values()) {
    if (node.kind === 'tool-call') {
      const root = (node.data as { root: ToolCallBlock }).root
      out.push(root)
    }
  }
  return out
}

/** Display name of a call: the settled call's name when present, else its id. */
function displayName(call: ToolCallBlock): string {
  return 'kind' in call ? (call.call?.name ?? call.callId) : call.name
}

/** Pretty-print a raw JSON args string, falling back to verbatim text. */
function pretty(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    // Not JSON (streaming fragment or plain text): show verbatim.
    return raw
  }
}

/** Flatten a settled result's content into display text. */
function rawResultText(block: ToolResultNode): string {
  const parts = block.content.map(item => item.type === 'text' ? item.text : JSON.stringify(item, null, 2))
  if (parts.length === 0 && block.error !== undefined) parts.push(`${block.error.name}: ${block.error.code}`)
  return parts.join('\n')
}

/** One selected call's input/output body. */
function ToolCallDetail({ block, t }: { block: ToolCallBlock; t: WorkspaceFilesTranslate }) {
  const settled = 'kind' in block
  const name = displayName(block)
  const argsRaw = settled ? block.call?.argsRaw ?? null : block.argsRaw
  return (
    <div className={css.toolDetail}>
      <div className={css.toolDetailTitle}>{name}</div>
      {argsRaw !== null && (
        <section className={css.section}>
          <div className={css.sectionLabel}>{t('tool.args')}</div>
          <CodeBlock code={pretty(argsRaw)} lang="json" copyLabel={t('copy')} copiedLabel={t('copied')} />
        </section>
      )}
      <section className={css.section}>
        <div className={css.sectionLabel}>{t('tool.output')}</div>
        {settled
          ? (
            <pre className={css.code} data-error={block.isError || undefined}>
              {rawResultText(block)}
            </pre>
          )
          : <div className={css.empty}>{t('tool.running')}</div>}
      </section>
    </div>
  )
}

/** The tools tab: a call list on top, the selected call's body below. */
export function ToolDetails({ useSession, t }: ToolDetailsProps) {
  const snapshot = useSession(s => s)
  const calls = useMemo(() => collectToolCalls(snapshot), [snapshot])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = calls.find(call => call.callId === selectedId) ?? null

  return (
    <div className={css.toolBody}>
      {calls.length === 0 && <div className={css.empty}>{t('tool.empty')}</div>}
      {calls.length > 0 && (
        <ul className={css.toolList} aria-label={t('tool.listAria')}>
          {calls.map(call => (
            <li key={call.callId}>
              <button
                type="button"
                className={selectedId === call.callId ? `${css.toolItem} ${css.toolItemActive}` : css.toolItem}
                aria-label={t('tool.callAria', { name: displayName(call) })}
                onClick={() => { setSelectedId(call.callId) }}
              >
                <span className={css.toolStatus} data-running={!('kind' in call) || undefined} />
                <span className={css.toolName}>{displayName(call)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected !== null && <ToolCallDetail block={selected} t={t} />}
    </div>
  )
}
