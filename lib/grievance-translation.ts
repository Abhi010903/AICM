import { Language } from './types';

const englishToMalayalam: Array<[string, string]> = [
  ['deep potholes', 'റോഡിൽ വലിയ കുഴികൾ'],
  ['severe traffic issues during rain', 'കനത്ത മഴയിൽ ഗതാഗതം തടസ്സപ്പെടുന്നു'],
  ['drinking water pipeline leak', 'കുടിവെള്ള പൈപ്പ് ചോർച്ച'],
  ['near public junction', 'പൊതു കവലയ്ക്ക് സമീപം'],
  ['high-mast streetlight non-functional', 'ഹൈമാസ്റ്റ് തെരുവ് വിളക്ക് പ്രവർത്തിക്കുന്നില്ല'],
  ['for past 3 weeks', 'കഴിഞ്ഞ 3 ആഴ്ചയായി'],
  ['drainage blockage causing waterlogging', 'ഓവുചാൽ അടഞ്ഞ് വെള്ളക്കെട്ടുണ്ടാകുന്നു'],
  ['road', 'റോഡ്'],
  ['water', 'വെള്ളം'],
  ['streetlight', 'തെരുവ് വിളക്ക്'],
  ['sanitation', 'ശുചിത്വം'],
];

const malayalamToEnglish: Array<[string, string]> = englishToMalayalam.map(
  ([english, malayalam]) => [malayalam, english]
);

function replacePhrases(text: string, phrases: Array<[string, string]>): string {
  return phrases.reduce(
    (translated, [source, target]) =>
      translated.replace(new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), target),
    text
  );
}

export function translateGrievanceDescription(text: string, targetLanguage: Language): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (targetLanguage === 'ml') {
    return replacePhrases(trimmed, englishToMalayalam);
  }
  return replacePhrases(trimmed, malayalamToEnglish);
}
