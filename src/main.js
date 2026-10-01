import {DiscordSDK, patchUrlMappings} from '@discord/embedded-app-sdk';
import {httpsURL, parseMappings, mappedURL, isDiscordActivity} from './config.js';
import {deployment} from './deployment.js';
import './style.css';

const $ = id => document.getElementById(id);
const config = {
  clientId: import.meta.env.VITE_DISCORD_CLIENT_ID || deployment.clientId,
  agentId: import.meta.env.VITE_PERXONA_AGENT_PROFILE_ID || deployment.agentId,
  embedKey: import.meta.env.VITE_PERXONA_EMBED_API_KEY || deployment.embedKey,
  widget: import.meta.env.VITE_PERXONA_WIDGET_URL || deployment.widget,
  live: import.meta.env.VITE_PERXONA_LIVE_URL || deployment.live,
};
const inDiscord = isDiscordActivity(window.location);
const logs = [];
let discordSdk;
let widgetPromise;
let mappings = [];
function log(message) {
  logs.push(`${new Date().toISOString()} ${message}`);
  $('log').textContent = logs.slice(-40).join('\n');
}
function hint(message) { $('hint').textContent = message; }
function withTimeout(promise, duration, message) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(new Error(message)), duration);})]).finally(() => clearTimeout(timer));
}
$('origin').textContent = window.location.origin;
$('app-id').textContent = config.clientId || '尚未設定';
$('profile-id').textContent = config.agentId || '尚未設定';
window.addEventListener('securitypolicyviolation', event => {
  // Record only origin and path. Do not include tokens or query parameters.
  let blocked = event.blockedURI;
  try {const url = new URL(blocked); blocked = url.origin + url.pathname;} catch {}
  log(`CSP ${event.violatedDirective}: ${blocked}`);
});

async function setup() {
  try {
    httpsURL(config.widget, 'Widget URL');
    httpsURL(config.live, 'Live Link');
    mappings = parseMappings(import.meta.env.VITE_PERXONA_MAPPINGS || JSON.stringify(deployment.mappings));
    if (inDiscord) {
      if (!/^\d{17,20}$/.test(config.clientId)) throw new Error('請設定有效的 VITE_DISCORD_CLIENT_ID，然後重新建置。');
      discordSdk = new DiscordSDK(config.clientId);
      await withTimeout(discordSdk.ready(), 12000, 'Discord SDK 連線逾時。請從 Discord App Launcher 啟動。');
      patchUrlMappings(mappings, {patchSrcAttributes: true});
      $('environment').textContent = 'Discord 已連線';
      log('Discord SDK ready；未授權使用者身分，也未讀取頻道訊息。');
      log(`Mappings: ${JSON.stringify(mappings)}`);
    } else {
      $('environment').textContent = '瀏覽器測試模式';
      log(`瀏覽器模式。此版 Deployment 預期網域為 ${deployment.domain}；直接在其他網域載入可能被拒絕。`);
    }
    if (!config.agentId.trim() || !config.embedKey.trim()) {
      hint('請先填入 agentProfileId 與對應目前網域的 Deployment embed apiKey。也可以先開啟 Live Link 測試。');
      $('diagnostics').open = true;
    } else {
      $('start').disabled = false;
      hint(inDiscord ? '按下開始載入，並確認文字及語音是否能對話。' : `此版 key 對應 ${deployment.domain}。請從 Discord 啟動測試；在此可確認介面或開啟 Live Link。`);
    }
  } catch (error) {
    $('environment').textContent = '設定待修正';
    hint(error.message); log(error.message); $('diagnostics').open = true;
  }
}

function loadWidget() {
  if (widgetPromise) return widgetPromise;
  widgetPromise = (async () => {
    if (!customElements.get('sv-agent')) {
      const src = mappedURL(config.widget, mappings, inDiscord);
      log(`載入 Widget: ${src.split('?')[0]}`);
      const script = document.createElement('script');
      script.type = 'module'; script.src = src;
      try {
        await withTimeout(new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Widget 腳本載入失敗。請檢查 CDN、CSP 與 URL Mapping。'));
          document.head.append(script);
        }), 20000, 'Widget 腳本載入逾時。');
      } catch(error) {script.remove(); throw error;}
    }
    await withTimeout(customElements.whenDefined('sv-agent'), 10000, 'Widget 未註冊 sv-agent。請確認 embed 腳本版本。');
    log('sv-agent 已註冊；Agent 引擎與對話連線尚待實測。');
  })().catch(error => {widgetPromise = undefined; throw error;});
  return widgetPromise;
}

$('start').addEventListener('click', async () => {
  $('start').disabled = true; $('agent-status').textContent = '載入中';
  hint('正在載入 3D 對話元件…');
  try {
    await loadWidget();
    const agent = document.createElement('sv-agent');
    agent.setAttribute('agentProfileId', config.agentId.trim());
    agent.setAttribute('apiKey', config.embedKey.trim());
    // Keep the known bubble mode from the supplied embed example.
    // Replace this attribute only after checking your current official embed code.
    agent.setAttribute('presentationMode', 'bubble');
    $('agent-mount').replaceChildren(agent);
    $('agent-status').textContent = '元件已建立 · 待驗證';
    hint('請開啟角色的對話泡泡。確認角色、文字和語音後，在診斷中記錄結果。');
    $('start').textContent = '重新載入角色';
    log('已建立 sv-agent，使用 bubble 模式。尚未收到官方 Agent ready 事件。');
  } catch(error) {
    $('agent-status').textContent = '載入失敗'; hint(error.message); log(error.message); $('diagnostics').open = true;
  } finally {$('start').disabled = false;}
});
$('external').addEventListener('click', async () => {
  try {
    const url = httpsURL(config.live, 'Live Link').href;
    if (inDiscord) {
      if (!discordSdk) throw new Error('Discord SDK 尚未就緒。請在瀏覽器手動開啟 README 中的 Live Link。');
      await discordSdk.commands.openExternalLink({url});
    } else {window.open(url, '_blank', 'noopener,noreferrer');}
    log('已請求開啟 Live Link。這是外部網頁備援。');
  } catch(error) {hint(error.message); log(error.message);}
});
$('copy').addEventListener('click', async () => {
  const report = [`Origin: ${window.location.origin}`, `Application ID: ${config.clientId || '(empty)'}`, `Agent Profile ID: ${config.agentId || '(empty)'}`, ...logs].join('\n');
  try {await navigator.clipboard.writeText(report); $('copy').textContent = '已複製';}
  catch {hint('無法存取剪貼簿，請手動複製下方診斷紀錄。');}
});
setup();
