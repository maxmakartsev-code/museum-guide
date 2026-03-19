"use client";

import { useEffect, useRef, useState } from "react";
import { guide, type GuideScreen, type Overlay } from "../data/guide";

const screens = guide;

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [liked, setLiked] = useState<boolean[]>(screens.map(() => false));
  const [currentImage, setCurrentImage] = useState<string | null>(
    screens[0].type === "audio" ? screens[0].baseImage : null
  );

  const [isZooming, setIsZooming] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startYRef = useRef(0);
  const pinchStartDistanceRef = useRef<number | null>(null);

  const audioPositionsRef = useRef<number[]>(screens.map(() => 0));

  const screen = screens[current];
  const isLikeable = screen.type !== "gif";

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

  const saveCurrentAudioPosition = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (screen.type !== "audio") return;

    audioPositionsRef.current[current] = audio.currentTime;
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && screen.type === "audio") {
      const distance = getTouchDistance(e.touches);
      pinchStartDistanceRef.current = distance;
      setIsZooming(true);
      return;
    }

    if (isZooming) return;

    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistanceRef.current && screen.type === "audio") {
      const currentDistance = getTouchDistance(e.touches);
      const nextScale = currentDistance / pinchStartDistanceRef.current;

      setZoomScale(Math.max(1, Math.min(nextScale, 3)));
      setIsZooming(true);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isZooming) {
      if (e.touches.length < 2) {
        pinchStartDistanceRef.current = null;
        setIsZooming(false);
        setZoomScale(1);
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

  const toggleLike = () => {
    if (!isLikeable) return;

    setLiked((prev) => {
      const updated = [...prev];
      updated[current] = !updated[current];
      return updated;
    });
  };

  useEffect(() => {
    if (screen.type === "audio") {
      const savedTime = audioPositionsRef.current[current] || 0;
      setCurrentImage(getImageForTime(screen, savedTime));
    } else {
      setCurrentImage(null);
    }

    setIsZooming(false);
    setZoomScale(1);
    pinchStartDistanceRef.current = null;
  }, [current, screen]);

  useEffect(() => {
    if (screen.type !== "audio") return;

    const audio = audioRef.current;
    if (!audio) return;

    const savedTime = audioPositionsRef.current[current] || 0;

    const restore = () => {
      audio.currentTime = savedTime;
      setCurrentImage(getImageForTime(screen, savedTime));
    };

    if (audio.readyState >= 1) {
      restore();
    } else {
      audio.addEventListener("loadedmetadata", restore, { once: true });
      return () => {
        audio.removeEventListener("loadedmetadata", restore);
      };
    }
  }, [current]);

  useEffect(() => {
    if (screen.type !== "audio") return;

    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      audioPositionsRef.current[current] = time;

      if (!isZooming) {
        setCurrentImage(getImageForTime(screen, time));
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [current, screen, isZooming]);

  const renderContent = (screen: GuideScreen) => {
    if (screen.type === "audio") {
      return (
        <>
          <div className="px-4 mt-3">
            <audio
              ref={audioRef}
              controls
              className="w-full"
              key={`${screen.audio}-${current}`}
            >
              <source src={screen.audio} type="audio/mpeg" />
              Ваш браузер не поддерживает аудио.
            </audio>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={currentImage ?? screen.baseImage}
              alt={screen.title}
              className="max-h-full rounded-xl touch-none select-none"
              style={{
                transform: `scale(${zoomScale})`,
                transition: isZooming ? "none" : "transform 0.2s ease",
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
        {isZooming ? "pinch zoom" : "↑ / ↓ swipe"}
      </div>
    </div>
  );
}