"""Deterministic tests for Bible ingestion normalization and metadata."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("ingest_bible.py")
SPEC = importlib.util.spec_from_file_location("ingest_bible", MODULE_PATH)
assert SPEC and SPEC.loader
INGEST = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INGEST)


class BibleIngestionTests(unittest.TestCase):
    def test_plain_arabic_removes_diacritics_and_normalizes_letters(self):
        self.assertEqual(
            INGEST.plain_arabic("إِنَّ ٱلْمَحَبَّةَ لاَ تَسْقُطُ أَبَدًا"),
            "ان المحبه لا تسقط ابدا",
        )

    def test_json_rows_preserve_canonical_text_and_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "verses.json"
            path.write_text(json.dumps([{
                "book": "كورنثوس الأولى",
                "book_nr": 46,
                "chapter": 13,
                "verse": 4,
                "text": "اَلْمَحَبَّةُ تَتَأَنَّى وَتَرْفُقُ.",
                "testament": "NT",
            }], ensure_ascii=False), encoding="utf-8")
            rows = INGEST.load_rows(path)

        self.assertEqual(rows[0]["book"], "كورنثوس الأولى")
        self.assertEqual(rows[0]["chapter"], 13)
        self.assertEqual(rows[0]["verse"], 4)
        self.assertIn("مَحَبَّة", rows[0]["text"])
        self.assertEqual(INGEST.plain_arabic(rows[0]["text"]), "المحبه تتاني وترفق.")

    def test_chapter_catalog_covers_all_bible_books(self):
        self.assertEqual(len(INGEST.CHAPTER_COUNTS), 66)
        self.assertGreater(sum(INGEST.CHAPTER_COUNTS), 1100)


if __name__ == "__main__":
    unittest.main()
