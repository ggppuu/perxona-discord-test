export function httpsURL(value, label) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${label} 必須為 HTTPS URL，且不可包含帳密。`);
  return url;
}
export function parseMappings(value) {
  const mappings = JSON.parse(value || '[]');
  if (!Array.isArray(mappings)) throw new Error('URL Mappings 必須是 JSON 陣列。');
  const prefixes = new Set();
  const targets = new Set();
  for (const item of mappings) {
    if (!item || typeof item.prefix !== 'string' || !/^\/[a-zA-Z0-9_-]+$/.test(item.prefix)) throw new Error('Mapping prefix 應如 /perxona-cdn。');
    if (typeof item.target !== 'string' || !/^[a-zA-Z0-9.-]+$/.test(item.target) || !item.target.includes('.')) throw new Error('Mapping target 應為網域，不含 https://、路徑或萬用字元。');
    if (prefixes.has(item.prefix) || targets.has(item.target)) throw new Error('Mapping prefix 與 target 不可重複。');
    prefixes.add(item.prefix); targets.add(item.target);
  }
  return mappings;
}
export function mappedURL(value, mappings, inDiscord) {
  const url = httpsURL(value, 'Widget URL');
  if (!inDiscord) return url.href;
  const match = mappings.find(item => item.target === url.hostname);
  if (!match) throw new Error(`尚未設定 ${url.hostname} 的 URL Mapping。`);
  return `/.proxy${match.prefix}${url.pathname}${url.search}`;
}
export function isDiscordActivity(location) {
  return location.hostname.endsWith('.discordsays.com');
}
