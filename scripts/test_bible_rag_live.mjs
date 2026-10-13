import assert from "node:assert/strict";

const baseUrl = process.env.BIBLE_RAG_TEST_URL ?? "http://127.0.0.1:3100";
const queries = [
  ["المحبة", ["1 كورنثوس 13:4"]],
  ["آيات عن المحبة", ["1 كورنثوس 13:4"]],
  ["التسامح وغفران الإساءة", ["تثنية 21:8", "المزامير 25:11"]],
  ["الرجاء", ["رومية 15:13"]],
  ["السلام والاطمئنان في الضيقات", ["إشعياء 57:19"]],
  ["آيات عن الإيمان", ["يوحنا 3:18"]],
  ["كورنثوس الأولى 13", ["1 كورنثوس 13:4"]],
];

async function search(query) {
  const response = await fetch(`${baseUrl}/api/bible/rag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, testamentFilter: "ALL" }),
  });
  assert.equal(response.status, 200, `${query}: expected a successful API response`);
  return response.json();
}

for (const [query, expectedReferences] of queries) {
  const result = await search(query);
  const references = result.sources.map((source) => `${source.book} ${source.chapter}:${source.verse}`);
  for (const expected of expectedReferences) {
    assert.ok(references.includes(expected), `${query}: missing ${expected}; got ${references.join(", ")}`);
  }
  for (const source of result.sources) {
    assert.ok(source.text, `${query}: source text must be present`);
    assert.ok(source.book && source.chapter && source.verse, `${query}: source metadata must be present`);
  }
}

const empty = await fetch(`${baseUrl}/api/bible/rag`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "   " }),
});
assert.equal(empty.status, 400);

console.log(`Verified ${queries.length} Arabic Bible RAG queries.`);
