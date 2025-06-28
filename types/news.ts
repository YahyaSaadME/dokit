export interface News {
  _id: string;
  headline: string;
  summary: {
    en: { audio: string, text: string },
    hi: { audio: string, text: string },
    hi_en: { audio: string, text: string }
  };
  date: string;
  country: string;
  state: string;
  city_town: string;
  genre: string;
  keywords: string;
  url: string;
  img: string;
  createdAt: string;
  isLiked?: boolean;
  likes?: string[];
  views?: number;
  comments?: any[];
} 