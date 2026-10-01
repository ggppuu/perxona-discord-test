# 已填好設定的 Discord 測試版

Application ID：`1555113706671571044`

Perxona Deployment domain：`1555113706671571044.discordsays.com`

Agent Profile ID：`01M3RHR6397XPTNV7FAMC480JP`

你提供的官方瀏覽器 embed key 已寫入 `src/deployment.js`。無須再填環境變數；環境變數仍可覆寫預設值。
此版尚未完成 Discord 與 Perxona 實際連線測試。

## 1. 部署

解壓縮並在 `perxona-discord` 資料夾打開終端機：

```bash
npm install
npx vercel --prod
```

依 Vercel 指示登入與建立專案，Framework 使用 Vite、輸出資料夾 `dist`。
也可以把原始碼放入自己的 Git repo，再從 Vercel 匯入。
若以 Vercel CLI 部署，沒有自動偵測到 Vite 時：Build Command 填 `npm run build`、Output Directory 填 `dist`。

取得 `https://你的專案.vercel.app`。直接開網址能看介面，但此版 key 已綁 Discord domain，在 Vercel 網域載入 Agent 被拒絕不一定是程式故障。

## 2. Discord URL Mappings

到 https://discord.com/developers/applications/1555113706671571044 ，Activities → URL Mappings：

| Prefix | Target |
| --- | --- |
| `/` | `你的專案.vercel.app` |
| `/perxona-cdn` | `cdn.dev.perxona.ai` |

Target 不填 `https://`。這裡只映射已知 CDN；實際 API、模型與 WebSocket 等網域待 Network 實測補齊，請勿把兩條 Mapping 視為完整連線保證。

## 3. 啟動

1. Activities → Settings → Enable Activities 開啟。
2. Discord → User Settings → Advanced → Developer Mode 開啟。
3. 用此 App 的擁有者或開發團隊帳號，從 Discord App Launcher 找到 App，使用 Launch 啟動。
4. 先確認「Discord 已連線」，再按「開始對話」。
5. 角色以 supplied embed 的 bubble 模式出現，請開啟泡泡實際測試對話。

如 App Launcher 找不到，檢查 Portal 的 Installation，使用提供的 Install Link 安裝到自己的帳號／測試伺服器；開發中的 Activity 需符合擁有者／團隊測試資格。

## 4. 失敗時

展開「測試診斷與設定」，複製紀錄。
若顯示 Widget 腳本失敗／CSP，請用 Discord 網頁版瀏覽器的開發者工具查看 Network 和 Console，找出被阻擋的網域。
需要新增的 Mapping 也要同步加入 `src/deployment.js` 的 mappings，然後重新部署。
若 API 401/403，需檢查 Perxona 的 domain 驗證方式與 key。
如果語音依賴 WebRTC，Discord Activity 目前不支援，請用 Live Link 備援或由 Perxona 提供相容連線方式。

## 商業功能

目前只有入口與個別角色對話，尚無讀取伺服器訊息、共享群聊、OAuth 身分、用量紀錄、訂閱或付款。
實測成功後再追加每伺服器對應不同 Agent 與每伺服器月費方案。

官方文件：https://docs.discord.com/developers/activities/building-an-activity

Networking：https://docs.discord.com/developers/activities/development-guides/networking
