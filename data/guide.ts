export type Overlay = {
  time: number;
  duration: number;
  image: string;
};

export type AudioScreen = {
  type: "audio";
  title: string;
  audio: string;
  baseImage: string;
  likes: number;
  overlays: Overlay[];
};

export type GifScreen = {
  type: "gif";
  title: string;
  gif: string;
  caption?: string;
};

export type TextScreen = {
  type: "text";
  title: string;
  body: string;
  likes: number;
  links?: {
    label: string;
    url: string;
  }[];
};

export type VideoScreen = {
  type: "video";
  title: string;
  video: string;
  likes: number;
};

export type GuideScreen = AudioScreen | GifScreen | TextScreen | VideoScreen;

export const guide: GuideScreen[] = [
  {
    type: "audio",
    title: "The Arnolfini Portrait",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    baseImage:
      "https://upload.wikimedia.org/wikipedia/commons/3/33/Van_Eyck_-_Arnolfini_Portrait.jpg",
    likes: 124,
    overlays: [
      {
        time: 5,
        duration: 4,
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Van_Eyck_-_Arnolfini_Portrait.jpg/800px-Van_Eyck_-_Arnolfini_Portrait.jpg",
      },
      {
        time: 12,
        duration: 4,
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Van_Eyck_-_Arnolfini_Portrait.jpg/600px-Van_Eyck_-_Arnolfini_Portrait.jpg",
      },
    ],
  },
  {
    type: "gif",
    title: "Navigation",
    gif: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
    caption: "Поверните направо и пройдите в следующий зал",
  },
  {
    type: "text",
    title: "Interesting detail",
    body: "Выпуклое зеркало в глубине комнаты — одна из самых знаменитых деталей картины. Через него Ван Эйк создает эффект присутствия зрителя внутри сцены.",
    likes: 57,
    links: [
      {
        label: "Подробнее о картине",
        url: "https://en.wikipedia.org/wiki/Arnolfini_Portrait",
      },
    ],
  },
  {
    type: "video",
    title: "Look closer",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    likes: 32,
  },
  {
    type: "audio",
    title: "The Baptism of Christ",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    baseImage:
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/Piero_della_Francesca_046.jpg",
    likes: 98,
    overlays: [
      {
        time: 6,
        duration: 4,
        image:
          "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Piero_della_Francesca_046.jpg/800px-Piero_della_Francesca_046.jpg",
      },
    ],
  },
];