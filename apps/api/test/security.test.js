import test from "node:test";
import assert from "node:assert/strict";
import {redact,makeSecret,sha256} from "../src/security.js";
test("redacts common credentials without changing ordinary diagnostic text",()=>{
 const value=redact("TypeError: fail authorization: Bearer abc123 api_key=secret999 https://alice:pass@example.com");
 assert.match(value,/TypeError: fail/);
 assert.doesNotMatch(value,/abc123|secret999|alice:pass/);
});
test("creates high-entropy URL-safe ingestion secrets",()=>{
 const first=makeSecret(),second=makeSecret();
 assert.match(first,/^[A-Za-z0-9_-]{40,}$/);
 assert.notEqual(first,second);
});
test("hashes values deterministically for stored-token comparisons",()=>{
 assert.equal(sha256("sample"),sha256("sample"));
 assert.notEqual(sha256("sample"),"sample");
});