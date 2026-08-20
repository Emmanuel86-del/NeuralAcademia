export interface LanguageLesson {
  id: string;
  language: string;
  unit: string;
  title: string;
  type: 'vocabulary' | 'grammar' | 'phrase' | 'dialogue';
  items: {
    native: string;
    target: string;
    pronunciation: string;
    example: string;
  }[];
}

export interface Flashcard {
  id: string;
  language: string;
  front: string;
  back: string;
  pronunciation: string;
}

export const languages = [
  { id: 'spanish', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { id: 'french', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { id: 'japanese', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { id: 'german', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
];

export const languageLessons: LanguageLesson[] = [
  {
    id: 'es-1', language: 'spanish', unit: 'Basics 1', title: 'Greetings & Introductions', type: 'vocabulary',
    items: [
      { native: 'Hello', target: 'Hola', pronunciation: 'OH-lah', example: 'Hola, ¿cómo estás?' },
      { native: 'Good morning', target: 'Buenos días', pronunciation: 'BWEH-nos DEE-as', example: 'Buenos días, señor.' },
      { native: 'Thank you', target: 'Gracias', pronunciation: 'GRAH-see-as', example: 'Muchas gracias por tu ayuda.' },
      { native: 'Please', target: 'Por favor', pronunciation: 'por fah-VOR', example: 'Un café, por favor.' },
      { native: 'Goodbye', target: 'Adiós', pronunciation: 'ah-DYOHS', example: 'Adiós, hasta luego.' },
    ],
  },
  {
    id: 'es-2', language: 'spanish', unit: 'Basics 1', title: 'Numbers 1-10', type: 'vocabulary',
    items: [
      { native: 'One', target: 'Uno', pronunciation: 'OO-noh', example: 'Tengo uno gato.' },
      { native: 'Two', target: 'Dos', pronunciation: 'dohs', example: 'Dos café, por favor.' },
      { native: 'Three', target: 'Tres', pronunciation: 'trehs', example: 'Las tres de la tarde.' },
      { native: 'Four', target: 'Cuatro', pronunciation: 'KWAH-troh', example: 'Cuatro estaciones.' },
      { native: 'Five', target: 'Cinco', pronunciation: 'SEEN-koh', example: 'Cinco minutos más.' },
    ],
  },
  {
    id: 'fr-1', language: 'french', unit: 'Basics 1', title: 'Greetings & Introductions', type: 'vocabulary',
    items: [
      { native: 'Hello', target: 'Bonjour', pronunciation: 'bohn-ZHOOR', example: 'Bonjour, comment ça va?' },
      { native: 'Thank you', target: 'Merci', pronunciation: 'mehr-SEE', example: 'Merci beaucoup.' },
      { native: 'Please', target: "S'il vous plaît", pronunciation: 'seel voo PLEH', example: "Un café, s'il vous plaît." },
      { native: 'Goodbye', target: 'Au revoir', pronunciation: 'oh ruh-VWAHR', example: 'Au revoir, à bientôt.' },
      { native: 'Yes', target: 'Oui', pronunciation: 'wee', example: 'Oui, je comprends.' },
    ],
  },
  {
    id: 'fr-2', language: 'french', unit: 'Basics 1', title: 'Numbers 1-10', type: 'vocabulary',
    items: [
      { native: 'One', target: 'Un', pronunciation: 'uhn', example: "J'ai un chien." },
      { native: 'Two', target: 'Deux', pronunciation: 'duh', example: "Deux billets, s'il vous plaît." },
      { native: 'Three', target: 'Trois', pronunciation: 'twah', example: 'Trois heures du matin.' },
      { native: 'Four', target: 'Quatre', pronunciation: 'KAH-truh', example: 'Quatre saisons.' },
      { native: 'Five', target: 'Cinq', pronunciation: 'sank', example: 'Cinq minutes.' },
    ],
  },
  {
    id: 'jp-1', language: 'japanese', unit: 'Basics 1', title: 'Greetings & Introductions', type: 'vocabulary',
    items: [
      { native: 'Hello', target: 'こんにちは', pronunciation: 'kon-nee-chee-WAH', example: 'こんにちは、元気ですか？' },
      { native: 'Thank you', target: 'ありがとう', pronunciation: 'ah-ree-GAH-toh', example: 'ありがとうございます。' },
      { native: 'Please', target: 'お願いします', pronunciation: 'oh-neh-GUY-shee-mas', example: 'コーヒー、お願いします。' },
      { native: 'Goodbye', target: 'さようなら', pronunciation: 'sah-yoh-NAH-rah', example: 'さようなら、またね。' },
      { native: 'Yes', target: 'はい', pronunciation: 'hai', example: 'はい、そうです。' },
    ],
  },
  {
    id: 'de-1', language: 'german', unit: 'Basics 1', title: 'Greetings & Introductions', type: 'vocabulary',
    items: [
      { native: 'Hello', target: 'Hallo', pronunciation: 'HAH-loh', example: 'Hallo, wie geht es dir?' },
      { native: 'Thank you', target: 'Danke', pronunciation: 'DAHN-keh', example: 'Danke schön!' },
      { native: 'Please', target: 'Bitte', pronunciation: 'BIT-teh', example: 'Einen Kaffee, bitte.' },
      { native: 'Goodbye', target: 'Auf Wiedersehen', pronunciation: 'owf VEE-der-zay-en', example: 'Auf Wiedersehen, bis bald.' },
      { native: 'Yes', target: 'Ja', pronunciation: 'yah', example: 'Ja, verstehe.' },
    ],
  },
];

export const allFlashcards: Flashcard[] = languageLessons.flatMap((lesson) =>
  lesson.items.map((item, i) => ({
    id: `${lesson.id}-fc-${i}`,
    language: lesson.language,
    front: item.native,
    back: item.target,
    pronunciation: item.pronunciation,
  }))
);

export function getLessonsByLanguage(langId: string): LanguageLesson[] {
  return languageLessons.filter((l) => l.language === langId);
}

export function getFlashcardsByLanguage(langId: string): Flashcard[] {
  return allFlashcards.filter((f) => f.language === langId);
}
