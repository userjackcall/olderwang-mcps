# olderwang-mcps

老王自製的 OpenCode MCP 伺服器集合。

## 一鍵安裝

```powershell
# 複製 repo
git clone https://github.com/userjackcall/olderwang-mcps.git
cd olderwang-mcps

# 執行安裝腳本（自動安裝依賴、提示設定 opencode.jsonc）
.\install.ps1

# 只裝特定 MCP
.\install.ps1 -SkipGas       # 只裝 agnes-image
.\install.ps1 -SkipAgnes     # 只裝 gas-mcp
```

安裝腳本會：
1. 檢查 Python / Node.js 是否已安裝
2. 自動安裝各 MCP 所需套件
3. 顯示需要手動貼到 `opencode.jsonc` 的設定內容

## MCP 一覽

| MCP | 說明 | 依賴 | API Key 需求 |
|-----|------|------|-------------|
| [agnes-image](agnes-image/README.md) | AI 圖片生成（文生圖 / 圖生圖） | Python + mcp + httpx | Agnes AI API Key |
| [gas-mcp](gas-mcp/README.md) | Google Apps Script 全功能管理 | Node.js 18+ | Google OAuth（首次執行認證） |

## 各 MCP 手動設定

### Agnes Image

在 `opencode.jsonc` 的 `mcp` 區塊中加入：

```jsonc
"agnes-image": {
  "type": "local",
  "command": ["python", "路徑/olderwang-mcps/agnes-image/agnes-image-server.py"],
  "enabled": true,
  "env": {
    "AGNES_API_KEY": "sk-你的金鑰"
  }
}
```

### Gas MCP

```jsonc
"gas": {
  "type": "local",
  "command": [
    "node", "路徑/olderwang-mcps/gas-mcp/dist/src/index.js",
    "--config", "路徑/olderwang-mcps/gas-mcp/gas-config.example.json"
  ],
  "enabled": true
}
```

首次使用需執行 OAuth 認證：

```bash
node 路徑/gas-mcp/dist/src/index.js --auth --config gas-config.json
```
