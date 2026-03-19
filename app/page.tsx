"use client";

import { useEffect, useRef, useState } from "react";
import { guide, type GuideScreen, type Overlay } from "../data/guide";

const screens = guide;

const STORAGE_KEYS = {
  currentScreen: "museum-guide-current-screen",
  audioPositions: "museum-guide-audio-positions",
};

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [liked, setLiked] = useState<boolean[]>(screens.map(() => false));
  const [currentImage, setCurrentImage] = useState<string | null>(
    screens[0].type === "audio" ? screens[0].baseImage : null
  );

  const [isZooming, setIsZooming] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const startYRef = useRef(0);

  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const pinchStartCenterRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const audioPositionsRef = useRef<number[]>(screens.map(() => 0));
  const initializedRef = useRef(false);

  const screen = screens[current];
  const isLikeable = screen.type !== "gif";

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const getImageForTime = (
    audioScreen: Extract<GuideScreen, { type: "audio" }>,
    time: number
  ) => {
    let activeOverlay: Overlay | null = null;

    for (const overlay of audioScreen.overlays) {
      if (time >= overlay.time && time <= overlay.time + overlay.duration) {
        activeOverlay = overlay;
      }
    }

    return activeOverlay ? activeOverlay.image : audioScreen.baseImage;
  };

  const persistAudioPositions = () => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.audioPositions,
        JSON.stringify(audioPositionsRef.current)
      );
    } catch {}
  };

  const saveCurrentAudioPosition = () => {
    if (screen.type !== "audio") return;
    const audio = audioRef.current;
    if (!audio) return;

    audioPositionsRef.current[current] = audio.currentTime;
    persistAudioPositions();
  };

  const resetZoom = () => {
    setIsZooming(false);
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
    setOriginX(0);
    setOriginY(0);

    pinchStartDistanceRef.current = null;
    pinchStartScaleRef.current = 1;
    pinchStartCenterRef.current = null;
    pinchStartPanRef.current = { x: 0, y: 0 };

    dragStartRef.current = null;
    dragStartPanRef.current = { x: 0, y: 0 };
  };

  const toggleLike = () => {
    if (!isLikeable) return;

    setLiked((prev) => {
      const updated = [...prev];
      updated[current] = !updated[current];
      return updated;
    });
  };

  const startPinch = (touches: React.TouchList) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const center = getTouchCenter(touches);
    const distance = getTouchDistance(touches);

    pinchStartDistanceRef.current = distance;
    pinchStartScaleRef.current = zoomScale;
    pinchStartCenterRef.current = center;
    pinchStartPanRef.current = { x: panX, y: panY };

    setOriginX(center.x - rect.left);
    setOriginY(center.y - rect.top);
    setIsZooming(true);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (screen.type !== "audio") {
      startYRef.current = e.touches[0].clientY;
      return;
    }

    if (e.touches.length === 2) {
      startPinch(e.touches);
      return;
    }

    if (e.touches.length === 1 && zoomScale > 1) {
      setIsZooming(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      dragStartPanRef.current = { x: panX, y: panY };
      return;
    }

    if (isZooming) return;

    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (screen.type !== "audio") return;

    if (e.touches.length === 2 && pinchStartDistanceRef.current) {
      const currentDistance = getTouchDistance(e.touches);
      const currentCenter = getTouchCenter(e.touches);

      const scale =
        pinchStartScaleRef.current *
        (currentDistance / pinchStartDistanceRef.current);

      const clampedScale = Math.max(1, Math.min(scale, 4));
      setZoomScale(clampedScale);

      if (pinchStartCenterRef.current) {
        const dx = currentCenter.x - pinchStartCenterRef.current.x;
        const dy = currentCenter.y - pinchStartCenterRef.current.y;

        setPanX(pinchStartPanRef.current.x + dx);
        setPanY(pinchStartPanRef.current.y + dy);
      }

      setIsZooming(true);
      return;
    }

    if (e.touches.length === 1 && dragStartRef.current && zoomScale > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;

      setPanX(dragStartPanRef.current.x + dx);
      setPanY(dragStartPanRef.current.y + dy);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (screen.type === "audio" && (isZooming || zoomScale > 1)) {
      if (e.touches.length === 0) {
        resetZoom();
      } else if (e.touches.length === 1 && zoomScale > 1) {
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        dragStartPanRef.current = { x: panX, y: panY };

        pinchStartDistanceRef.current = null;
        pinchStartCenterRef.current = null;
      }
      return;
    }

    const endY = e.changedTouches[0].clientY;
    const diff = startYRef.current - endY;

    if (diff > 50 && current < screens.length - 1) {
      saveCurrentAudioPosition();
      setCurrent((prev) => prev + 1);
    }

    if (diff < -50 && current > 0) {
      saveCurrentAudioPosition();
      setCurrent((prev) => prev - 1);
    }
  };

  // Инициализация из localStorage
  useEffect(() => {
    if (initializedRef.current) return;

    try {
      const savedScreen = localStorage.getItem(STORAGE_KEYS.currentScreen);
      const savedPositions = localStorage.getItem(STORAGE_KEYS.audioPositions);

      if (savedPositions) {
        const parsed = JSON.parse(savedPositions);
        if (Array.isArray(parsed)) {
          audioPositionsRef.current = parsed.map((v) =>
            typeof v === "number" ? v : 0
          );
        }
      }

      if (savedScreen) {
        const parsedScreen = Number(savedScreen);
        if (
          Number.isInteger(parsedScreen) &&
          parsedScreen >= 0 &&
          parsedScreen < screens.length
        ) {
          setCurrent(parsedScreen);
        }
      }
    } catch {}

    initializedRef.current = true;
  }, []);

  // Сохраняем номер текущего экрана
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.currentScreen, String(current));
    } catch {}
  }, [current]);

  useEffect(() => {
    if (screen.type === "audio") {
      const savedTime = audioPositionsRef.current[current] || 0;
      setCurrentImage(getImageForTime(screen, savedTime));
    } else {
      setCurrentImage(null);
    }

    resetZoom();
  }, [current, screen]);

  useEffect(() => {
    if (screen.type !== "audio") return;

    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      audioPositionsRef.current[current] = time;
      persistAudioPositions();

      if (!isZooming) {
        setCurrentImage(getImageForTime(screen, time));
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [current, screen, isZooming]);

  // Сохраняем позицию при уходе в фон / возврате
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;

      if (document.hidden) {
        if (screen.type === "audio" && audio) {
          audioPositionsRef.current[current] = audio.currentTime;
          persistAudioPositions();
        }
        try {
          localStorage.setItem(STORAGE_KEYS.currentScreen, String(current));
        } catch {}
      } else {
        if (screen.type === "audio" && audio) {
          const savedTime = audioPositionsRef.current[current] || 0;
          try {
            if (Math.abs(audio.currentTime - savedTime) > 0.3) {
              audio.currentTime = savedTime;
            }
          } catch {}
          setCurrentImage(getImageForTime(screen, savedTime));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [current, screen]);

  const renderContent = (screen: GuideScreen) => {
    if (screen.type === "audio") {
      const savedTime = audioPositionsRef.current[current] || 0;

      return (
        <>
          <div className="px-4 mt-3">
            <audio
              key={`audio-${current}`}
              ref={audioRef}
              controls
              preload="metadata"
              className="w-full"
              onLoadedMetadata={(e) => {
                const audio = e.currentTarget;
                const time = audioPositionsRef.current[current] || 0;

                if (time > 0) {
                  try {
                    audio.currentTime = time;
                  } catch {}
                }
              }}
            >
              <source src={screen.audio} type="audio/mpeg" />
              Ваш браузер не поддерживает аудио.
            </audio>
          </div>

          <div className="px-4 pt-2 text-xs opacity-50">
            saved: {savedTime.toFixed(1)}s
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              ref={imageRef}
              src={currentImage ?? screen.baseImage}
              alt={screen.title}
              className="max-h-full rounded-xl touch-none select-none"
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
                transformOrigin: `${originX}px ${originY}px`,
                transition: isZooming ? "none" : "transform 0.2s ease",
                touchAction: "none",
                willChange: "transform",
              }}
              draggable={false}
            />
          </div>
        </>
      );
    }

    if (screen.type === "gif") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
          <img
            src={screen.gif}
            alt={screen.title}
            className="max-h-[70vh] rounded-xl"
          />
          {screen.caption && (
            <div className="text-center text-sm opacity-80">{screen.caption}</div>
          )}
        </div>
      );
    }

    if (screen.type === "text") {
      return (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-xl text-base leading-7 opacity-90">
            {screen.body}
          </div>

          {screen.links && screen.links.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              {screen.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline opacity-90"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (screen.type === "video") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <video
            key={screen.video}
            controls
            playsInline
            className="w-72 h-72 rounded-full object-cover bg-zinc-900"
          >
            <source src={screen.video} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        </div>
      );
    }

    return null;
  };

  const likesCount =
    isLikeable && "likes" in screen
      ? screen.likes + (liked[current] ? 1 : 0)
      : null;

  return (
    <div
      className="h-screen bg-black text-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-between items-center p-4 text-sm opacity-80">
        <div>←</div>
        <div>
          {current + 1} / {screens.length}
        </div>

        {isLikeable ? (
          <div onClick={toggleLike} className="cursor-pointer select-none">
            {liked[current] ? "❤️" : "♡"} {likesCount}
          </div>
        ) : (
          <div className="opacity-40">—</div>
        )}
      </div>

      <div className="px-4 text-lg font-semibold">{screen.title}</div>

      {renderContent(screen)}

      <div className="text-center pb-6 text-sm opacity-60">
        {isZooming ? "pinch / drag" : "↑ / ↓ swipe"}
      </div>
    </div>
  );
}