import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { MessagesSquare } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ConversationList from "../components/chat/ConversationList.jsx";
import MessageBubble, { TypingIndicator } from "../components/chat/MessageBubble.jsx";
import Composer from "../components/chat/Composer.jsx";
import BotPicker from "../components/chat/BotPicker.jsx";
import Starters from "../components/chat/Starters.jsx";
import ReportModal from "../components/chat/ReportModal.jsx";
import * as chatApi from "../api/chat.js";
import { useAsync } from "../hooks/useAsync.js";
import { useToast } from "../context/toastContext.js";

const EMPTY_THREAD = { id: null, messages: [] };

export default function Chat() {
  const toast = useToast();
  const location = useLocation();
  const handoff = location.state ?? {};

  const loadBots = useCallback(() => chatApi.listBots(), []);
  const loadConversations = useCallback(() => chatApi.listConversations({ limit: 50 }), []);

  const botsState = useAsync(loadBots);
  const conversationsState = useAsync(loadConversations);

  const bots = botsState.data?.bots ?? [];
  const conversations = conversationsState.data?.data ?? [];

  const [activeId, setActiveId] = useState(null);
  // One piece of state, so `messages` and the conversation they belong to cannot drift apart.
  const [thread, setThread] = useState(EMPTY_THREAD);
  const [draft, setDraft] = useState(handoff.prompt ?? "");
  const [focusKey, setFocusKey] = useState(handoff.prompt ? 1 : 0);
  const [bot, setBot] = useState(handoff.bot ?? "auto");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reporting, setReporting] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  const bottomRef = useRef(null);

  // Derived, so no effect has to flip a loading flag.
  const threadLoading = Boolean(activeId) && thread.id !== activeId;
  const messages = thread.id === activeId ? thread.messages : [];

  // Drop the hand-off state so a refresh does not refill the composer.
  useEffect(() => {
    if (handoff.prompt || handoff.bot) window.history.replaceState({}, "");
  }, [handoff.prompt, handoff.bot]);

  // Fetch a thread only when it is not the one already held.
  useEffect(() => {
    if (!activeId || thread.id === activeId) return;

    let active = true;
    chatApi
      .getConversation(activeId)
      .then(({ messages: list }) => active && setThread({ id: activeId, messages: list }))
      .catch((error) => {
        if (!active) return;
        toast.error(error.message);
        setThread({ id: activeId, messages: [] });
      });
    return () => {
      active = false;
    };
  }, [activeId, thread.id, toast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [thread, sending]);

  // Seeding the thread alongside the id stops the effect above from re-fetching an
  // empty conversation and racing the first reply.
  function adopt(conversation) {
    setActiveId(conversation.id);
    setThread({ id: conversation.id, messages: [] });
  }

  async function onNew() {
    setCreating(true);
    try {
      const { conversation } = await chatApi.createConversation();
      adopt(conversation);
      setListOpen(false);
      conversationsState.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function onSend() {
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setDraft("");
    try {
      let conversationId = activeId;
      if (!conversationId) {
        const { conversation } = await chatApi.createConversation();
        adopt(conversation);
        conversationId = conversation.id;
      }

      const { userMessage, message } = await chatApi.sendMessage(conversationId, { content, bot });
      setThread((current) =>
        current.id === conversationId
          ? { id: conversationId, messages: [...current.messages, userMessage, message] }
          : { id: conversationId, messages: [userMessage, message] }
      );
      conversationsState.reload();
    } catch (error) {
      // Put the text back so nothing is lost when it could not be sent.
      setDraft(content);
      setFocusKey((key) => key + 1);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  }

  function onPickStarter(question, suggestedBot) {
    setDraft(question);
    setBot(suggestedBot ?? "auto");
    setFocusKey((key) => key + 1);
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await chatApi.deleteConversation(pendingDelete.id);
      if (pendingDelete.id === activeId) {
        setActiveId(null);
        setThread(EMPTY_THREAD);
      }
      toast.success("Conversation deleted.");
      setPendingDelete(null);
      conversationsState.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }

  const listProps = {
    conversations,
    loading: conversationsState.loading,
    activeId,
    onSelect: (id) => {
      setActiveId(id);
      setListOpen(false);
    },
    onNew,
    onDelete: setPendingDelete,
    creating,
  };

  const empty = !threadLoading && messages.length === 0;

  return (
    <div className="flex gap-4">
      <aside className="glass hidden w-72 shrink-0 p-3 lg:block" aria-label="Conversations">
        <ConversationList {...listProps} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="glass flex items-center justify-between gap-3 p-3">
          <BotPicker bots={bots} value={bot} onChange={setBot} loading={botsState.loading} />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setListOpen(true)}
            className="lg:hidden"
          >
            <MessagesSquare className="size-4" aria-hidden="true" />
            Chats
          </Button>
        </div>

        <div className="glass min-h-[24rem] flex-1 overflow-y-auto p-4">
          {threadLoading ? (
            <div className="space-y-4">
              <Skeleton className="ml-auto h-16 w-2/3 rounded-3xl" />
              <Skeleton className="h-24 w-3/4 rounded-3xl" />
              <Skeleton className="ml-auto h-16 w-1/2 rounded-3xl" />
            </div>
          ) : empty ? (
            <Starters onPick={onPickStarter} />
          ) : (
            <ul className="space-y-4" aria-live="polite" aria-relevant="additions">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} onReport={setReporting} />
              ))}
              {sending ? <TypingIndicator /> : null}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        <Composer
          value={draft}
          onChange={setDraft}
          onSend={onSend}
          sending={sending}
          autoFocusKey={focusKey}
        />

        <p className="px-1 text-center text-[11px] text-slate-500">
          The assistant gives general information, not medical or legal advice. In an emergency,
          call 112.
        </p>
      </div>

      <Modal open={listOpen} onClose={() => setListOpen(false)} title="Your conversations" size="sm">
        <div className="max-h-[60dvh]">
          <ConversationList {...listProps} />
        </div>
      </Modal>

      {reporting ? <ReportModal message={reporting} onClose={() => setReporting(null)} /> : null}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this conversation?"
        description="The messages go with it, and this cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep
            </Button>
            <Button variant="danger" loading={deleting} onClick={onDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
