param(
  [switch]$SkipAgnes,
  [switch]$SkipGas
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$OpenCodeConfig = "$env:USERPROFILE\.config\opencode\opencode.jsonc"

Write-Host "=== olderwang-mcps Installer ===" -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot" -ForegroundColor Gray
Write-Host ""

# ─── 讀取現有 opencode.jsonc ───
if (Test-Path $OpenCodeConfig) {
  $config = Get-Content $OpenCodeConfig -Raw -Encoding UTF8
} else {
  $config = '{ "mcp": {} }'
}

# ─── Agnes Image ───
if (-not $SkipAgnes) {
  Write-Host "--- Agnes Image MCP ---" -ForegroundColor Yellow
  $py = (Get-Command python -ErrorAction SilentlyContinue).Source
  if (-not $py) { Write-Warning "Python not found, skipping agnes-image"; $SkipAgnes = $true }

  if (-not $SkipAgnes) {
    pip install mcp httpx -q 2>$null
    Write-Host "  Python packages installed" -ForegroundColor Green

    $scriptPath = "$RepoRoot\agnes-image\agnes-image-server.py"
    $mcpConfig = @"
    "agnes-image": {
      "type": "local",
      "command": ["python", "$scriptPath"],
      "enabled": true
    }
"@
    Write-Host "  Add to opencode.jsonc with:"
    Write-Host "    env: { AGNES_API_KEY: \"sk-...\" }" -ForegroundColor Gray
  }
}

# ─── Gas MCP ───
if (-not $SkipGas) {
  Write-Host "--- Gas MCP ---" -ForegroundColor Yellow
  $node = (Get-Command node -ErrorAction SilentlyContinue).Source
  if (-not $node) { Write-Warning "Node.js not found, skipping gas-mcp"; $SkipGas = $true }

  if (-not $SkipGas) {
    $gasDir = "$RepoRoot\gas-mcp"
    if (Test-Path "$gasDir\package.json") {
      Push-Location $gasDir
      npm install --silent 2>$null
      Pop-Location
      Write-Host "  npm packages installed" -ForegroundColor Green
    }

    $entry = "$gasDir\dist\src\index.js"
    if (-not (Test-Path $entry)) { $entry = "$gasDir\src\index.ts" }
    $mcpConfig = @"
    "gas": {
      "type": "local",
      "command": ["node", "$entry", "--config", "$gasDir\gas-config.example.json"],
      "enabled": true
    }
"@
    Write-Host "  Add to opencode.jsonc with:" -ForegroundColor Gray
    Write-Host "    First run: node $entry --auth --config $gasDir\gas-config.json" -ForegroundColor Gray
  }
}

Write-Host ""
Write-Host "=== Manual Step: Add MCPs to opencode.jsonc ===" -ForegroundColor Cyan
Write-Host "Edit $OpenCodeConfig" -ForegroundColor White
Write-Host "and add the following inside the `"mcp`" block:" -ForegroundColor White
Write-Host ""
if (-not $SkipAgnes) {
  Write-Host @"
  "agnes-image": {
    "type": "local",
    "command": ["python", "$RepoRoot\agnes-image\agnes-image-server.py"],
    "enabled": true,
    "env": {
      "AGNES_API_KEY": "sk-your-key-here"
    }
  },
"@ -ForegroundColor Magenta
}
if (-not $SkipGas) {
  Write-Host @"
  "gas": {
    "type": "local",
    "command": ["node", "$RepoRoot\gas-mcp\dist\src\index.js", "--config", "$RepoRoot\gas-mcp\gas-config.example.json"],
    "enabled": true
  }
"@ -ForegroundColor Magenta
}
Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
