import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Sparkles, Bot, User, Dumbbell, Apple, Info, type LucideIcon } from 'lucide-react';
import { AppScreen } from '@/src/components/layout/screen';
import { StitchCanvas, StitchPageHeader } from '@/src/components/layout/stitch-page';
import { ABOVE_MOBILE_NAV, APP_CONTENT } from '@/src/components/layout/shell';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import AI_Prompt from '@/src/components/kokonutui/ai-prompt';

const SUGGESTIONS: ReadonlyArray<{ icon: LucideIcon; text: string }> = [
  { icon: Dumbbell, text: 'How do I build muscle?' },
  { icon: Sparkles, text: 'Create a workout plan for me' },
  { icon: Apple, text: 'What should I eat pre-workout?' },
];

const TYPING_DELAYS = ['0ms', '150ms', '300ms'] as const;

const COACH_MODELS = [
  {
    name: 'RhinoFit Coach',
    description: 'Training, nutrition and recovery',
    efforts: ['Quick', 'Balanced', 'Detailed'],
    defaultEffort: 'Balanced',
  },
];

const COACH_COMMANDS = [
  { id: 'workout', label: 'Workout plan', description: 'Build a weekly training plan' },
  { id: 'nutrition', label: 'Nutrition tip', description: 'Pre/post workout food ideas' },
  { id: 'recovery', label: 'Recovery', description: 'Rest and mobility advice' },
];

interface AICoachPageProps {
  messages: Message[];
  onSendMessage: (messageText: string) => void;
  isLoading: boolean;
  onClose: () => void;
}

const AICoachPage: React.FC<AICoachPageProps> = ({ messages, onSendMessage, isLoading, onClose }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingResolveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && pendingResolveRef.current) {
      pendingResolveRef.current();
      pendingResolveRef.current = null;
    }
  }, [isLoading]);

  const handleSubmit = (value: string) =>
    new Promise<void>((resolve) => {
      pendingResolveRef.current = resolve;
      onSendMessage(value.trim());
    });

  return (
    <AppScreen className="flex min-w-0 flex-col bg-[#f9fafb] dark:bg-background">
      <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <StitchCanvas className="!space-y-0 !py-4">
          <StitchPageHeader
            title={
              <span className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                AI fitness coach
              </span>
            }
            description="Training, nutrition and recovery advice"
            actions={
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            }
          />
        </StitchCanvas>
      </div>

      <div className="flex-1 overflow-y-auto pb-[calc(13rem_+_env(safe-area-inset-bottom))] md:pb-6">
        <StitchCanvas className="!pt-4">
          <div className="mx-auto w-full max-w-2xl space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center gap-6 py-8 text-center md:py-12">
                <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary md:size-20">
                  <Sparkles className="size-8 md:size-10" aria-hidden />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                    Start a conversation
                  </h2>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    Ask anything about fitness, nutrition, workout plans or recovery.
                  </p>
                </div>
                <ul className="grid w-full max-w-md gap-2">
                  {SUGGESTIONS.map(({ icon: Icon, text }) => (
                    <li key={text}>
                      <button
                        type="button"
                        onClick={() => onSendMessage(text)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                        {text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex animate-fade-in items-start gap-3',
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    aria-hidden
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-xl',
                      isUser ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    )}
                  >
                    {isUser ? <User className="size-5" /> : <Bot className="size-5" />}
                  </div>

                  <div
                    className={cn(
                      'flex max-w-[80%] flex-col gap-1',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 shadow-sm',
                        isUser
                          ? 'rounded-tr-md bg-primary text-white'
                          : 'rounded-tl-md border border-border bg-card text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                    <span className="px-1 text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div
                className="flex animate-fade-in items-start gap-3"
                role="status"
                aria-label="Coach is typing"
              >
                <div
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
                >
                  <Bot className="size-5" />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    {TYPING_DELAYS.map((delay) => (
                      <span
                        key={delay}
                        className="size-2 animate-bounce rounded-full bg-primary"
                        style={{ animationDelay: delay }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </StitchCanvas>
      </div>

      <div
        className={cn(
          'fixed inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur',
          'md:sticky md:inset-x-auto',
          ABOVE_MOBILE_NAV
        )}
      >
        <div className={cn('mx-auto w-full max-w-2xl py-3', APP_CONTENT)}>
          <AI_Prompt
            models={COACH_MODELS}
            defaultModel="RhinoFit Coach"
            placeholder="Ask your fitness coach anything..."
            headerText=""
            commands={COACH_COMMANDS}
            onSubmit={handleSubmit}
            className="w-full"
          />
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Info className="size-3" aria-hidden />
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </AppScreen>
  );
};

export default AICoachPage;
