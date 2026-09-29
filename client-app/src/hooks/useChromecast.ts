import { useCallback, useEffect, useState } from "react";

// DeMille/url-cast-receiver hosted app
const CAST_RECEIVER_ID = "5CB45E5A";
const CAST_NAMESPACE = "urn:x-cast:com.url.cast";

type CastState = "unavailable" | "loading" | "no_devices" | "available" | "connected";

let sdkLoadPromise: Promise<boolean> | null = null;
let castContext: cast.framework.CastContext | null = null;

function loadCastSdk(): Promise<boolean> {
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    if (window.cast?.framework) {
      resolve(true);
      return;
    }

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      resolve(isAvailable);
    };

    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
    script.async = true;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

function initializeCastApi(): cast.framework.CastContext | null {
  if (castContext) return castContext;
  if (!window.cast?.framework) return null;

  castContext = window.cast.framework.CastContext.getInstance();
  castContext.setOptions({
    receiverApplicationId: CAST_RECEIVER_ID,
    autoJoinPolicy: window.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED ?? "origin_scoped",
  });

  return castContext;
}

function toCastState(castState: string): CastState {
  switch (castState) {
    case window.cast!.framework.CastState.NO_DEVICES_AVAILABLE:
      return "no_devices";
    case window.cast!.framework.CastState.CONNECTED:
      return "connected";
    default:
      return "available";
  }
}

export default function useChromecast() {
  const [state, setState] = useState<CastState>("loading");

  useEffect(() => {
    let cancelled = false;
    let unbind: (() => void) | undefined;
    loadCastSdk().then((available) => {
      const context = available ? initializeCastApi() : null;
      if (cancelled) return;
      if (!context) {
        setState("unavailable");
        return;
      }
      const eventType = window.cast!.framework.CastContextEventType.CAST_STATE_CHANGED;
      const updateState = () => setState(toCastState(context.getCastState()));
      context.addEventListener(eventType, updateState);
      unbind = () => context.removeEventListener(eventType, updateState);
      updateState();
    });
    return () => {
      cancelled = true;
      unbind?.();
    };
  }, []);

  //Must be called from a click handler, the device picker requires a user gesture.
  const castUrl = useCallback(async (url: string) => {
    if (!castContext) return false;
    try {
      //A receiver that already navigated with "loc" no longer listens for messages, so always start fresh.
      castContext.endCurrentSession(true);
      await castContext.requestSession();
      const session = castContext.getCurrentSession();
      if (!session) return false;
      await session.sendMessage(CAST_NAMESPACE, { type: "loc", url });
      return true;
    } catch (error) {
      console.warn("Cast failed:", error);
      return false;
    }
  }, []);

  const stopCasting = useCallback(() => {
    castContext?.endCurrentSession(true);
  }, []);

  return {
    state,
    castUrl,
    stopCasting,
    isAvailable: state === "available" || state === "connected",
    isConnected: state === "connected",
  };
}
