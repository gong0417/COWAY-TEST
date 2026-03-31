/** 한글 음절 → 초성 문자열 (Fuse 보조 인덱스) */
const CHO = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

export function toChosungString(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const base = code - 0xac00;
      out += CHO[Math.floor(base / 588)] ?? "";
    } else {
      out += ch;
    }
  }
  return out;
}

export function flattenForSearch(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
