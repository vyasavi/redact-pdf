// src/lib/mapping.ts
import { TextToken } from './pdf-engine';

export interface RedactionBox {
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
  text?: string;
  category?: string;
  isActive?: boolean;
}

const CATEGORY_MAP: Record<string, string> = {
  PER: 'Names',
  ORG: 'Organizations',
  LOC: 'Locations',
  DATE_TIME: 'Dates & Times',
  EMAIL: 'Emails',
  PHONE_NUMBER: 'Phone Numbers',
  SSN: 'SSNs',
  CREDIT_CARD: 'Credit Cards',
  IP_ADDRESS: 'IP Addresses',
  IBAN_CODE: 'IBAN_CODE',
  CUSTOM_ID: 'CUSTOM_ID'
};

export const mapPIIToCoordinates = (
  tokens: TextToken[],
  piiEntities: any[]
): RedactionBox[] => {
  const boxes: RedactionBox[] = [];

  piiEntities.forEach(entity => {
    // 1. Clean the AI word (remove that leading space and any weird artifacts)
    const targetWord = entity.word.trim();
    if (!targetWord) return;

    // 2. Identify which tokens contain parts of this name
    tokens.forEach(token => {
      const cleanToken = token.text.trim();
      if (!cleanToken) return;

      // FUZZY MATCH: If the PDF word is inside the AI name, 
      // or the AI name is inside the PDF word, we redact it.
      // e.g. If AI found "Hargrove" and PDF token is "Hargrove," it's a match.
      const isMatch = 
        targetWord.includes(cleanToken) || 
        cleanToken.includes(targetWord);

      if (isMatch) {
        const top = token.pageHeight - token.y - token.height;
        boxes.push({
          x: (token.x / token.pageWidth) * 100,
          y: (top / token.pageHeight) * 100,
          w: (token.width / token.pageWidth) * 100,
          h: (token.height / token.pageHeight) * 100,
          page: token.page,
          text: cleanToken,
          category: CATEGORY_MAP[entity.entity_group] || entity.entity_group,
          isActive: true
        });
      }
    });
  });

  // Remove duplicates
  return boxes.filter((box, index, self) =>
    index === self.findIndex((b) => (
      b.x === box.x && b.y === box.y && b.page === box.page
    ))
  );
};