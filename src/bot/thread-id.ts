import type { LarkChannel } from '@larksuite/channel';
import { log } from '../core/logger';

/**
 * Recover a message's topic IDs via the raw `im.v1.message.get`
 * API.
 *
 * Feishu delivers a sizable fraction of topic-group message events (and every
 * card-action carrier) without a `thread_id` on the event payload — notably the
 * message that starts a new topic. The bridge routes topic replies and isolates
 * per-topic session scope off `thread_id`, so a missing one makes the reply
 * escape into a brand-new topic and collapses the scope to the chat level.
 *
 * The raw `im.v1.message.get` items DO carry `thread_id` even when the event
 * dropped it. We deliberately avoid `channel.fetchMessage()`: its
 * NormalizedMessage path rebuilds a synthetic raw event without `thread_id`, so
 * threadId always comes back undefined.
 *
 * Returns `undefined` when the lookup fails. A message outside a topic can
 * still return an object with no IDs.
 */
export async function lookupMessageTopic(
  channel: LarkChannel,
  messageId: string,
): Promise<{ threadId?: string; rootId?: string; replyToMessageId?: string } | undefined> {
  try {
    // ApiMessageItem's SDK type omits these fields even though the API returns them.
    const [message] = await channel.fetchRawMessage(messageId) as Array<{
      thread_id?: string;
      root_id?: string;
      parent_id?: string;
    }>;
    if (!message) return undefined;
    return {
      threadId: message.thread_id || undefined,
      rootId: message.root_id || undefined,
      replyToMessageId: message.parent_id || undefined,
    };
  } catch (err) {
    log.warn('thread', 'thread-id-lookup-failed', {
      messageId,
      err: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
}
