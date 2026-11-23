import type { NormalizedMessage } from '@larksuite/channel';
import type { ChatMode } from './chat-mode-cache';

export interface RoutedMessage extends NormalizedMessage {
  /** The Feishu root message ID is available before Feishu assigns a thread ID. */
  topicRootId?: string;
}

export function imRoute(
  msg: Pick<NormalizedMessage, 'chatId' | 'messageId' | 'threadId' | 'rootId' | 'replyToMessageId'>,
  mode: ChatMode,
  autoTopicReplies: boolean,
): { scope: string; mode: ChatMode; topicRootId?: string } {
  if (autoTopicReplies && mode !== 'topic') {
    const rootId = msg.rootId ?? msg.replyToMessageId ?? (msg.threadId ? undefined : msg.messageId);
    if (rootId) {
      return { scope: `${msg.chatId}:${rootId}`, mode: 'topic', topicRootId: rootId };
    }
  }
  if (msg.threadId) {
    return { scope: `${msg.chatId}:${msg.threadId}`, mode: 'topic' };
  }
  return { scope: msg.chatId, mode };
}
