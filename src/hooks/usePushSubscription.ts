"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/actions/push";

/** atob-based base64url -> Uint8Array, the shape PushManager.subscribe's applicationServerKey needs — standard boilerplate for turning a VAPID public key string into what the Push API expects. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
  return array;
}

export type PushSupport = "checking" | "unsupported" | "supported";

interface UsePushSubscriptionResult {
  support: PushSupport;
  subscribed: boolean;
  busy: boolean;
  error: "denied" | "generic" | null;
  toggle: () => Promise<void>;
}

/**
 * Registers /sw.js (see public/sw.js) and drives subscribe/unsubscribe —
 * used by the toggle in NotificationBell.tsx. Browser support is feature-
 * detected (serviceWorker + PushManager) rather than assumed, since not
 * every browser this site's visitors use supports Web Push.
 */
export function usePushSubscription(): UsePushSubscriptionResult {
  const [support, setSupport] = useState<PushSupport>("checking");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"denied" | "generic" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setSupport("unsupported");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) {
          setSupport("supported");
          setSubscribed(!!existing);
        }
      } catch {
        if (!cancelled) setSupport("unsupported");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const keyRes = await fetch("/api/push/public-key");
      const { publicKey } = (await keyRes.json()) as { publicKey: string | null };
      if (!publicKey) throw new Error("Push not configured");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      await subscribeToPush(
        { endpoint: json.endpoint!, keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth } },
        navigator.userAgent
      );
      setSubscribed(true);
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await unsubscribeFromPush(endpoint);
      }
      setSubscribed(false);
    } catch {
      setError("generic");
    } finally {
      setBusy(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (subscribed) await unsubscribe();
    else await subscribe();
  }, [subscribed, subscribe, unsubscribe]);

  return { support, subscribed, busy, error, toggle };
}
