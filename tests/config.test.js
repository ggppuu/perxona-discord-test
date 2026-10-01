import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseMappings, mappedURL, httpsURL, isDiscordActivity} from '../src/config.js';
test('browser keeps the original HTTPS URL', () => {
  assert.equal(mappedURL('https://cdn.example.com/entry/index.js', [], false), 'https://cdn.example.com/entry/index.js');
});
test('Discord maps CDN resources through the proxy and preserves the query', () => {
  const maps = parseMappings('[{"prefix":"/cdn","target":"cdn.example.com"}]');
  assert.equal(mappedURL('https://cdn.example.com/entry/index.js?v=1', maps, true), '/.proxy/cdn/entry/index.js?v=1');
  assert.throws(() => mappedURL('https://api.example.com/a', maps, true), /URL Mapping/);
});
test('invalid mapping configuration fails clearly', () => {
  for(const value of ['{}', '[{"prefix":"/","target":"a.com"}]', '[{"prefix":"/cdn","target":"https://a.com"}]', '[{"prefix":"/a","target":"a.com"},{"prefix":"/a","target":"b.com"}]']) assert.throws(() => parseMappings(value));
});
test('credentials and non-HTTPS links are rejected', () => {
  assert.throws(() => httpsURL('javascript:alert(1)', 'URL'));
  assert.throws(() => httpsURL('https://user:pass@a.com', 'URL'));
});
test('Discord detection does not match lookalike domains', () => {
  assert.equal(isDiscordActivity({hostname:'123.discordsays.com'}), true);
  assert.equal(isDiscordActivity({hostname:'discordsays.com.evil.com'}), false);
});
