# Google Apps Script MCP Server

透過 MCP（Model Context Protocol）讓 AI 直接讀寫、執行、管理你的 Google Apps Script 專案。

## 這是什麼？

這是一個全功能的 Google Apps Script（GAS）MCP 伺服器，讓 AI 可以直接：

- 瀏覽、讀取、編輯 GAS 專案檔案
- 執行程式碼與查看執行結果
- 管理部署版本與觸發器
- 搜尋專案內容與查看依賴關係
- 查詢 Google Sheets 資料（SQL-like）
- Git 版控整合

## 前置準備

### 需求

- Node.js 18+
- 一個 Google 帳號（用於 OAuth 授權）

### 安裝

```bash
npm install
```

### 設定

建立 `gas-config.json`：

```json
{
  "oauth": {
    "client_id": "YOUR_CLIENT_ID",
    "type": "uwp",
    "redirect_uris": ["http://127.0.0.1/*", "http://localhost/*"],
    "scopes": [
      "https://www.googleapis.com/auth/script.projects",
      "https://www.googleapis.com/auth/script.processes",
      "https://www.googleapis.com/auth/script.deployments",
      "https://www.googleapis.com/auth/script.scriptapp",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  },
  "projects": {}
}
```

### OAuth 授權

執行授權流程取得 Google OAuth 憑證：

```bash
node dist/src/index.js --auth --config gas-config.json
```

## 在 opencode 中使用

將此 MCP 加入 `opencode.jsonc`：

```jsonc
{
  "mcp": {
    "gas": {
      "type": "local",
      "command": [
        "node", "路徑/gas-mcp/dist/src/index.js",
        "--config", "路徑/gas-mcp/gas-config.json"
      ],
      "enabled": true
    }
  }
}
```

## 可用工具

此 MCP 提供大量工具，主要分為以下類別：

| 類別 | 工具 | 說明 |
|------|------|------|
| **認證** | `auth` | OAuth 2.0 登入/狀態/登出 |
| **檔案** | `cat`, `write`, `edit`, `ls`, `find`, `cp`, `mv`, `rm` | 讀寫編輯 GAS 檔案 |
| **執行** | `exec`, `exec_api` | 執行 GAS 程式碼 |
| **搜尋** | `grep`, `ripgrep`, `sed` | 搜尋與取代程式碼 |
| **試算表** | `sheet_sql` | SQL-like 查詢 Google Sheets |
| **部署** | `deploy`, `deploy_config` | 管理部署版本 |
| **觸發器** | `trigger` | 設定時間觸發/事件觸發 |
| **Git** | `git_feature`, `rsync`, `worktree` | 版控整合 |
| **專案** | `project_create`, `project_init`, `project_list` | 專案管理 |
| **記錄** | `executions`, `cloud_logs`, `process_list` | 檢視執行記錄 |
| **分析** | `deps`, `file_status` | 相依性與檔案狀態 |

完整工具清單請參考 `src/` 目錄下的原始碼。

## 檔案結構

```
gas-mcp/
├── src/                   # TypeScript 原始碼
├── dist/                  # 編譯後的 JavaScript
├── docs/                  # 文件
├── examples/              # 使用範例
├── test/                  # 測試
├── gas-runtime/           # GAS 執行時期輔助腳本
├── gas-projects/          # 專案相關檔案
├── scripts/               # 輔助腳本
├── package.json
├── tsconfig.json
├── CLAUDE.md              # 專案開發指引
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## 授權

詳見 `LICENSE` 檔案。
