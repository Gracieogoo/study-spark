const supabaseUrl = 'https://xhlureuwlzvhpyocbhoo.supabase.co';
const supabaseKey = 'sb_publishable__txFRwOz52Is4tjeGvSkpQ_XfA6WMG2';
// A tiny dummy PDF file encoded as base64
const dummyPdf = 'JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLY2UlBQUzEwUDPWKEpMLlAwVYiG0YgGylgL1K6TCRK9cKxArzAwU/ByLEnNTQfy0vLx0BUMFExNdA2N9U0NdA3OTuBKu1IKYnNKi1BIFl9xCBYXEPDBbwbEkJ0ehpLYwsaS4AKQdAFNQKFEKZW5kc3RyZWFtCmVuZG9iagoKCjMgMCBvYmoKMTE5CmVuZG9iagoKMSAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1Jlc291cmNlczw8L0ZvbnQ8PC9GMCA0IDAgUj4+Pj4vQ29udGVudHMgMiAwIFIvUGFyZW50IDUgMCBSPj4KZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYS9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKCjUgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMSAwIFJdPj4KZW5kb2JqCgo2IDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyA1IDAgUj4+CmVuZG9iagoKNyAwIG9iago8PC9Qcm9kdWNlcihEaXBEUyBcKHBhaW50by5kZXNpZ25cKSkgL0NyZWF0aW9uRGF0ZShEOjIwMjMwMTAxMDAwMDAwWik+PgplbmRvYmoKCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDE4NSAwMDAwMCBuIAowMDAwMDAwMDE4IDAwMDAwIG4gCjAwMDAwMDAxNjYgMDAwMDAgbiAKMDAwMDAwMDMwMSAwMDAwMCBuIAowMDAwMDAwMzg5IDAwMDAwIG4gCjAwMDAwMDA0NDkgMDAwMDAgbiAKMDAwMDAwMDUwMSAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgOC9Sb290IDYgMCBSL0luZm8gNyAwIFIvSUQgWzwxNDhiMmYzMGVjMDg0MWMwYWExYjU3YzFmMGE2YzAyMT4gPDE0OGIyZjMwZWMwODQxYzBhYTFiNTdjMWYwYTZjMDIxPl0+PgpzdGFydHhyZWYKNTEyCiUlRU9GCg==';

async function testPdf() {
  console.log("Sending request...");
  const result = await fetch(`${supabaseUrl}/functions/v1/pdf-process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      action: "summarize",
      pdfBase64: dummyPdf
    })
  });
  
  console.log("Status:", result.status);
  console.log("Status Text:", result.statusText);
  const text = await result.text();
  console.log("Response:", text);
}

testPdf().catch(console.error);
