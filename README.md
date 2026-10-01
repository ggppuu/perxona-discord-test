# Perxona Discord Activity — 0.1 測試版

**本包已依使用者提供的 Application ID 與 embed 設定完成預設值。請先讀 `START_HERE.md`。**
`src/deployment.js` 是預設公開瀏覽器設定；以下環境變數說明用於覆寫設定。

這是一個可建置的 Discord Activity 起始專案，不是已上架／已安裝的 Discord App。
入口與 SDK 初始化已實作；Perxona embed、實際對話和語音需在你的 Deployment 與 Discord Application 上驗證。

## 本版範圍

- Discord Embedded App SDK 2.5.0，Activity 內初始化與逾時提示。
- 一般瀏覽器測試模式，可先確認 Perxona embed 在自己的網域能用。
- 按鈕載入官方 `sv-agent` 元件，保留已提供範例中的 `presentationMode="bubble"`。
- Discord URL Mappings 的 CDN 改寫、fetch / XHR / WebSocket / src 改寫。
- 顯示當前 Origin、設定、CSP 阻擋與載入紀錄。
- 外部 Live Link 備援：https://live.dev.perxona.ai/eu/sova/jason_test
- 無身分登入、沒有讀取伺服器訊息、沒有群組共享對話、没有計費。
- 沒有虛構 Agent ready 事件：元件註冊與建立不代表對話已可用。

## 1. 建立 Discord Application

1. 打開 https://discord.com/developers/applications ，按 **New Application**。
2. 名稱可設為 **Perxona Community Avatar**。
3. 在 **General Information** 複製 **Application ID**。
4. Discord 用戶端：**User Settings → Advanced → Developer Mode** 開啟。
5. 在 **Installation** 保留 User Install 與 Guild Install；測試先使用自己的帳號與測試伺服器。
6. 開發中的 Activity 預設僅擁有者／開發團隊可啟動，其他測試者要加入對應開發團隊。

此版只呼叫 SDK ready 與 openExternalLink，未做 OAuth 登入，因此不需要 Client Secret 或 Bot Token。
後續要綁定身分、管理會員／用量，需另加伺服器端 OAuth 與權限驗證。

## 2. 本機設定

需要 Node.js 22.12+ 或 24 LTS。

```bash
cp .env.example .env
npm install
npm run dev
```

如要覆寫預設值，編輯 `.env` 的主要欄位：

```dotenv
VITE_DISCORD_CLIENT_ID=你的ApplicationID
VITE_PERXONA_AGENT_PROFILE_ID=你的agentProfileId
VITE_PERXONA_EMBED_API_KEY=該Deployment的瀏覽器embedKey
```

`agentProfileId` 請從目前有效的 Perxona embed 程式碼複製；已設定使用者本次提供的 ID。
你的後台截圖確認 `sv-agent` 也需要 `apiKey`。請使用目標 domain 對應的 Deployment key；本版已使用最後提供的 Discord Deployment key。
每筆 Deployment 只允許一個 domain，且不支援萬用字元。建議瀏覽器測試與 Discord 使用不同 Deployment／對應 key；若後台只能建立一筆，則切換 domain 後更新 key 設定並重新部署。
若正式 embed 的腳本位置或必要屬性不同，請更新 `.env` 和 `src/main.js` 的元件建立段落。

打開 http://localhost:5173 。先按「開啟 Live Link」確認既有 Agent 能對話，再按「開始對話」驗證 embed。
localhost 也需要符合 Perxona 自身 Deployment 設定。

## 3. 部署到 Vercel

1. 將專案放進自己的 Git repo，匯入 Vercel；或在本機專案目錄使用 Vercel CLI。
2. Framework 選 **Vite**，Build Command `npm run build`，Output Directory `dist`。
3. 把 `.env.example` 內的環境變數填入 Vercel Environment Variables。
4. 部署後取得公開 HTTPS 網址，例如 `https://YOUR-PROJECT.vercel.app`。
5. 先直接開該網址測試 embed；若這裡就失敗，先修復 Perxona Deployment，不要先排查 Discord。

`VITE_` 變數會公開在前端 bundle。不要填入 API secret、Client Secret 或 Bot Token。
`VITE_PERXONA_EMBED_API_KEY` 僅供官方 embed 用的 domain-bound 瀏覽器 key，也會公開；不可改填後端／管理用的 secret。
修改環境變數後必須重新部署。

## 4. Discord Activity 設定

Developer Portal → 你的 App → **Activities → URL Mappings**，新增：

| Prefix | Target |
| --- | --- |
| `/` | `YOUR-PROJECT.vercel.app` |
| `/perxona-cdn` | `cdn.dev.perxona.ai` |

Target 不填 `https://`。儲存後在 **Activities → Settings** 啟用 **Enable Activities**。
Discord 會自動建立預設的 **Launch** Entry Point command；此版不需要額外 `/perxona` Bot。
從 Discord App Launcher 啟動你的 App。若找不到，確認 Developer Mode、Application 所有權／團隊身分、安裝設定，以及 Activities 已啟用。

## 5. Perxona Deployment 與其他網域

Activity 顯示在 Discord 的代理網域，例如：

```text
https://YOUR_APPLICATION_ID.discordsays.com
```

頁面診斷會顯示實際 Origin。請依 Perxona 實際的 domain 驗證規則，明確允許測試所需的網域；不要只允許 Vercel 後就假設 Discord 也會通過。
若 Perxona 還檢查 parent／ancestor origin 或 SDK 特定身分驗證，要由 Perxona 工程端確認支援方式。
本程式不會繞過 domain、CORS 或 access control。

CDN 是目前唯一已知的資源網域；API、WebSocket、模型、音訊等網域需要從 Network 取得。
每個實際網域都需要 **Portal 設定與程式設定一致**。例如發現新的 API 網域時：

1. Portal 增加 `/perxona-api` → `ACTUAL_API_HOST`。
2. `VITE_PERXONA_MAPPINGS` 增加對應物件：

```json
[
  {"prefix":"/perxona-cdn","target":"cdn.dev.perxona.ai"},
  {"prefix":"/perxona-api","target":"ACTUAL_API_HOST"}
]
```

上面的 `ACTUAL_API_HOST` 是佔位符，請換成實際網域，不可照貼。
SDK 的 patchUrlMappings 不保證改寫動態 import、worker、worklet 或元件內部所有連線。
若 Widget 的 ESM 依賴使用其他絕對網址，仍可能被 CSP 阻擋；此時需要 Perxona 提供可用相對資源／代理路徑的 build。

## 6. 語音限制與驗證

Discord 官方 Activity Networking 文件指出 **WebRTC is not supported**。
目前未能取得 Perxona 腳本內容，無法確認其語音 transport。
若 Perxona 使用 WebRTC，這版不能直接保證語音可用；需要相容 transport 或使用外部 Live Link。
若使用 WebSocket，也仍須設定對應 Mapping 與驗證麥克風權限、播放行為。
Live Link 按鈕在 Discord 中使用 SDK `openExternalLink`，由 Discord／瀏覽器決定外部開啟行為。

## 7. 驗收順序

1. 直接開 Live Link：確認 Agent 本身能用。
2. 在 Vercel 網頁：確認角色可見、文字能回答、語音輸入與輸出可用。
3. 在 Discord：先確認「Discord 已連線」。
4. 按「開始對話」：确认 Widget 註冊與建立。
5. 實際測試角色、文字與語音；勾選診斷核對項目。
6. 若失敗，記錄 Network 的 request host、status、CSP 與角色錯誤；避免分享包含 token 的完整請求網址。

| 現象 | 優先排查 |
| --- | --- |
| 開始按鈕未啟用 | 是否填 Agent Profile ID 與 embed API key；環境變數是否重新建置 |
| SDK 逾時 | 是否從真正 Activity 啟動、Client ID 是否正確 |
| blocked:csp | Portal Mapping、程式 Mapping、ESM／worker 絕對 URL |
| 401 / 403 | Perxona Deployment、Session／Token、實際 Origin |
| 元件建立但引擎失敗 | Perxona API／模型請求及 Widget 版本 |
| 文字可用但語音失敗 | WebRTC transport、麥克風權限、音訊播放 |

## 指令與官方文件

```bash
npm test
npm run build
npm run preview
```

- Discord 官方起始教學：https://docs.discord.com/developers/activities/building-an-activity
- Networking：https://docs.discord.com/developers/activities/development-guides/networking
- SDK：https://github.com/discord/embedded-app-sdk

## 下一版商業化

本版先驗證「社群主的專屬角色入口」。若互動有回訪，再加入伺服器與 Agent 對應、OAuth 身分、伺服器端用量紀錄與方案。
可採「每伺服器月費，包含一定對話額度；客製角色另外報價」。這些功能尚未實作。
