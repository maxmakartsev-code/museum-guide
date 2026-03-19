export type Overlay = {
  time: number;
  duration: number;
  image: string;
};

export type GuideScreen =
  | {
      type: "text";
      title: string;
      body: string;
      likes: number;
      links?: {
        label: string;
        url: string;
      }[];
    }
  | {
      type: "gif";
      title: string;
      gif: string;
      caption?: string;
    }
  | {
      type: "audio";
      title: string;
      audio: string;
      baseImage: string;
      likes: number;
      overlays: Overlay[];
    }
  | {
      type: "video";
      title: string;
      video: string;
      likes: number;
    };

export const guide: GuideScreen[] = [
  {
    type: "text",
    title: "Национальная галерея в 20 историях",
    body: "Мы собрали увлекательные истории про главные шедевры галереи. Поехали! Свайпите вниз, чтобы перейти к следующему экрану",
    likes: 1,
  },
  {
    type: "gif",
    title: "Куда идти",
    gif: "/gifs/Scheme.gif",
    caption: "Идем к первому экспонату",
  },
  {
    type: "audio",
    title: "Arnolfini Portrait",
    audio: "/audio/Adoration.mp3",
    baseImage: "/images/Adoration.jpg",
    likes: 1,
    overlays: [
      {
        time: 240,
        duration: 4,
        image: "/images/Adoration zoom-1.png",
      },
      {
        time: 244,
        duration: 4,
        image: "/images/Adoration zoom-2.png",
      },
      {
        time: 248,
        duration: 4,
        image: "/images/Adoration zoom-3.png",
      },
    ],
  },
  {
    type: "video",
    title: "и ещё кое-что",
    video: "/video/video.mp4",
    likes: 50,
  },
  {
    type: "gif",
    title: "Идем дальше",
    gif: "/gifs/Scheme.gif",
    caption: "Переходим к следующему залу",
  },
];