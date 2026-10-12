type BibleReferenceProps = {
  bookName: string;
  chapter: number;
  verse: number;
  className?: string;
};

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toArabicIndicDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)]);
}

export default function BibleReference({
  bookName,
  chapter,
  verse,
  className,
}: BibleReferenceProps) {
  return <span className={className}>{bookName} {toArabicIndicDigits(chapter)}:{toArabicIndicDigits(verse)}</span>;
}
