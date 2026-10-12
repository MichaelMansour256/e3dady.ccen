type BibleReferenceProps = {
  bookName: string;
  chapter: number;
  verse: number;
  className?: string;
};

/**
 * Keep the Arabic book name and the numeric passage as separate bidi runs.
 * This prevents the browser from reordering the punctuation or digits inside
 * an RTL paragraph.
 */
export default function BibleReference({
  bookName,
  chapter,
  verse,
  className,
}: BibleReferenceProps) {
  return (
    <span dir="rtl" className={className}>
      <span>{bookName}</span>{" "}
      <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
        {chapter}:{verse}
      </span>
    </span>
  );
}
