# Agnes Image MCP Server

透過 MCP（Model Context Protocol）讓 AI 直接呼叫 Agnes AI 的圖片生成模型，支援文生圖與圖生圖。

## 這是什麼？

這是一個輕量級的 Python MCP 伺服器，包裝了 Agnes AI 的 `agnes-image-2.1-flash` 圖片生成 API，讓 AI 助理可以直接「畫圖」給你——不需要手動開網站、不用複製貼上提示詞。

## 前置準備

### 1. 安裝 Python 套件

```bash
pip install mcp httpx
```

### 2. 設定 API Key

向 Agnes AI 申請 API Key，然後設定環境變數：

```bash
# Windows PowerShell
$env:AGNES_API_KEY = "sk-your-key-here"

# 永久設定
[Environment]::SetEnvironmentVariable("AGNES_API_KEY", "sk-your-key-here", "User")
```

## 在 opencode 中使用

將此 MCP 加入 `opencode.jsonc`：

```jsonc
{
  "mcp": {
    "agnes-image": {
      "type": "local",
      "command": ["python", "路徑/olderwang-mcps/agnes-image/agnes-image-server.py"],
      "enabled": true,
      "env": {
        "AGNES_API_KEY": "sk-your-key-here"
      }
    }
  }
}
```

## 可用工具

### `generate_image`

產生或編輯圖片。

**參數：**

| 參數 | 必填 | 預設值 | 說明 |
|------|------|--------|------|
| `prompt` | 是 | — | 圖片的文字描述（文生圖），或編輯指令（圖生圖） |
| `size` | 否 | `1024x768` | 圖片尺寸，如 `1024x768`、`1920x1080` |
| `image_url` | 否 | `""` | 輸入圖片的公開 URL（留空=文生圖，填寫=圖生圖編輯） |
| `response_format` | 否 | `"url"` | `"url"` 回傳圖片網址，`"b64_json"` 回傳 base64 |

**使用範例（文生圖）：**

```
請幫我生成一張「夕陽下的山脈」圖片，尺寸 1920x1080
```

**使用範例（圖生圖編輯）：**

```
把這張圖片的風格改為水彩畫：
[圖片網址]
```

## 技術細節

- 使用 **FastMCP** 框架實作，透過 stdio transport 與 AI 溝通
- 底層呼叫 Agnes AI 的 `https://apihub.agnes-ai.com/v1/images/generations` API
- 模型名稱：`agnes-image-2.1-flash`
- 支援圖片尺寸：常見比例均可（如 `1024x768`、`1920x1080`、`768x1024` 等）
- 圖生圖模式：將 `image_url` 指向公開圖片網址，`prompt` 寫編輯指示
- 回傳格式：預設回傳圖片 URL，亦可選 base64

## 授權

MIT
