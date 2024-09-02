export function getAllPunctuation(text: string): string[] {
  const punctuationRegex = /[.,/#!$%^&*;:{}=\-_`~()]/g;
  const punctuations = text.match(punctuationRegex);
  return punctuations || [];
}

export function removePunctuation(text: string): string {
  return text.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
}

export function makeTextPlain(text: string) {
  const plainText =
    removePunctuation(text).charAt(0) +
    removePunctuation(text).slice(1).toLowerCase();

  return plainText.split(" ").map((word) => ({
    word: word,
    punctuation: null,
  }));
}
