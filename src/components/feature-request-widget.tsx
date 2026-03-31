"use client";

import { AnimatePresence, motion } from "motion/react";
import { Heart, Mail, MessageCircle, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FEATURE_REQUEST_MAX_MESSAGE = 1000;

interface WidgetIntentOption {
  id: "feature-request" | "wall-of-love";
  label: string;
  title: string;
  icon: typeof Sparkles;
}

const INTENT_OPTIONS: WidgetIntentOption[] = [
  {
    id: "feature-request",
    label: "Feature request",
    title: "Request a feature",
    icon: Sparkles,
  },
  {
    id: "wall-of-love",
    label: "Wall of love",
    title: "Be on our wall of love",
    icon: Heart,
  },
];

interface QuickActionOption {
  id: "feature-request" | "wall-of-love" | "contact";
  label: string;
  icon: typeof Sparkles;
  x: number;
  y: number;
}

const QUICK_ACTIONS: QuickActionOption[] = [
  {
    id: "feature-request",
    label: "Feature request",
    icon: Sparkles,
    x: -74,
    y: -8,
  },
  { id: "wall-of-love", label: "Wall of love", icon: Heart, x: -58, y: -58 },
  { id: "contact", label: "Contact page", icon: Mail, x: -8, y: -74 },
];

type QuickActionId = QuickActionOption["id"];

function getLocaleFromPathname(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] ?? "en";
}

export function FeatureRequestWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tooltipOpenState, setTooltipOpenState] = useState<
    Record<QuickActionId, boolean>
  >({
    "feature-request": false,
    "wall-of-love": false,
    contact: false,
  });
  const [intent, setIntent] =
    useState<WidgetIntentOption["id"]>("feature-request");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedIntent = INTENT_OPTIONS.find((option) => option.id === intent);
  const trimmedMessageLength = message.trim().length;

  function onOpenForm(nextIntent: WidgetIntentOption["id"]) {
    setIntent(nextIntent);
    setIsMenuOpen(false);
    setIsOpen(true);
  }

  function onContactRedirect() {
    const locale = getLocaleFromPathname(pathname);
    router.push(`/${locale}/contact`);
    setIsMenuOpen(false);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail || !trimmedMessage) {
      toast.error("Email and message are required");
      return;
    }
    if (trimmedMessage.length > FEATURE_REQUEST_MAX_MESSAGE) {
      toast.error(
        `Message must be ${FEATURE_REQUEST_MAX_MESSAGE} chars or less`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const intentPrefix =
        intent === "wall-of-love" ? "[Wall of Love]" : "[Feature Request]";
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          message: `${intentPrefix}\n${trimmedMessage}`,
        }),
      });

      const payload: unknown = await response.json().catch(() => null);
      const errorCode =
        payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : "";

      if (!response.ok) {
        if (response.status === 503 || errorCode === "unavailable") {
          toast.error("Feature request is unavailable right now");
          return;
        }
        if (response.status === 400 || errorCode === "validation") {
          toast.error("Please provide a valid email and message");
          return;
        }
        toast.error("Could not send feature request");
        return;
      }

      toast.success(
        intent === "wall-of-love"
          ? "Wall of love message sent"
          : "Feature request sent",
      );
      setMessage("");
      setIsOpen(false);
    } catch {
      toast.error("Could not send feature request");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-end justify-end">
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="feature-widget-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="w-[min(92vw,360px)] rounded-2xl border border-border bg-card p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm">{selectedIntent?.title}</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setIsOpen(false)}
                aria-label="Close feature request form"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email"
                autoComplete="email"
                maxLength={254}
                required
                disabled={isSubmitting}
              />
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  intent === "wall-of-love"
                    ? "Share your kind words..."
                    : "Type your feature request..."
                }
                rows={5}
                maxLength={FEATURE_REQUEST_MAX_MESSAGE}
                required
                disabled={isSubmitting}
                className="resize-y"
              />
              <p className="text-muted-foreground text-xs">
                {trimmedMessageLength}/{FEATURE_REQUEST_MAX_MESSAGE}
              </p>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send request"}
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isOpen ? (
        <div className="relative h-14 w-14">
          <AnimatePresence>
            {isMenuOpen
              ? QUICK_ACTIONS.map((action, index) => {
                  const Icon = action.icon;
                  function onQuickActionClick() {
                    if (action.id === "contact") {
                      onContactRedirect();
                      return;
                    }
                    onOpenForm(action.id);
                  }
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        x: action.x,
                        y: action.y,
                        scale: 1,
                      }}
                      exit={{ opacity: 0, x: 0, y: 0, scale: 0.8 }}
                      transition={{
                        type: "spring",
                        stiffness: 340,
                        damping: 24,
                        delay: index * 0.03,
                      }}
                      className="absolute right-1 bottom-1"
                    >
                      <Tooltip
                        open={tooltipOpenState[action.id]}
                        onOpenChange={(isOpen) =>
                          setTooltipOpenState((prev) => ({
                            ...prev,
                            [action.id]: isOpen,
                          }))
                        }
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={onQuickActionClick}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-transform hover:scale-105"
                            aria-label={action.label}
                          >
                            <Icon className="size-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side={
                            action.id === "contact" ||
                            action.id === "wall-of-love"
                              ? "top"
                              : "left"
                          }
                          align={
                            action.id === "contact" ||
                            action.id === "wall-of-love"
                              ? "end"
                              : "center"
                          }
                          sideOffset={10}
                        >
                          {action.label}
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  );
                })
              : null}
          </AnimatePresence>

          <motion.button
            type="button"
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            className="absolute right-0 bottom-0 inline-flex h-14 w-14 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105"
            aria-label={
              isMenuOpen ? "Close quick actions" : "Open quick actions"
            }
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            {isMenuOpen ? (
              <X className="size-6" />
            ) : (
              <MessageCircle className="size-6" />
            )}
          </motion.button>
        </div>
      ) : null}
    </div>
  );
}
