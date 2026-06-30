const { google } = require('googleapis');
const fs = require('fs');

const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'your-client-id';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'your-client-secret';
const REDIRECT_URI = 'http://localhost:32603';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'];

// 各 ETF 各年度含息報酬率 (2023-2025)
const ETF_KEYS = ['0056', '00878', '00919', '00929'];
const ETF_NAMES = ['0056 元大高股息', '00878 國泰永續高股息', '00919 群益台灣精選高息', '00929 復華台灣科技優息'];
const YEARS = [2023, 2024, 2025];
// returns[etfIndex][yearIndex]
const RETURNS = [
  [56.9, 7.7, 12.0],   // 0056
  [43.8, 11.1, 6.3],   // 00878
  [46.8, 17.6, 7.3],   // 00919
  [32.4, 3.3, 5.5],    // 00929
];

const SHARPE = [0.88, 0.76, 0.95, 0.52];
const VOLATILITY = [18.5, 16.2, 19.1, 22.3];

function calcAvg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function calcStdDev(arr) {
  const avg = calcAvg(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length - 1));
}

function fmt(v) { return Number(v.toFixed(2)); }

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'auth';

  if (mode === 'auth') {
    const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
    console.log('\n=== 請在瀏覽器中開啟以下網址進行 Google 認證 ===\n');
    console.log(authUrl);
    console.log('\n================================================');
    console.log('\n認證後瀏覽器會導向到 ' + REDIRECT_URI + '?code=...');
    console.log('請複製網址列中 code 參數的值（不含 &scope=... 部分）並貼上：\n');
    return;
  }

  if (mode === 'token') {
    const code = args[1];
    if (!code) { console.error('請提供授權碼'); process.exit(1); }
    const { tokens } = await oauth2Client.getToken(code);
    console.log(JSON.stringify(tokens, null, 2));
    return;
  }

  if (mode === 'create') {
    let tokenJson = args[1];
    if (!tokenJson) tokenJson = process.env.GOOGLE_TOKEN_JSON;
    oauth2Client.setCredentials(JSON.parse(tokenJson));

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // 1. 建立試算表
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: '台股高股息ETF 含息報酬率分析 (2023-2025)' },
        sheets: [{ properties: { title: '年度報酬率' } }, { properties: { title: '統計分析' } }],
      },
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    console.log('試算表已建立:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);

    // 2. 填入年度報酬率 (表頭強制存為純文字)
    const headerRow = ['年度', ...ETF_NAMES];
    const dataRows = YEARS.map((y, yi) => {
      const row = [`'${y}`]; // 加單引號強制存為文字避免數字格式
      for (let ei = 0; ei < 4; ei++) row.push(RETURNS[ei][yi]);
      return row;
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: '年度報酬率!A1:E4',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headerRow.map(h => `'${h}`), ...dataRows] },
    });

    // 3. 填入統計分析
    const avgRow = ['平均年化報酬率 (%)', ...RETURNS.map(r => fmt(calcAvg(r)))];
    const stdRow = ['標準差 (%)', ...RETURNS.map(r => fmt(calcStdDev(r)))];
    const sharpeRow = ['夏普值', ...SHARPE];
    const volRow = ['波動率 (%)', ...VOLATILITY];

    const statsHeaderRow = ETF_KEYS.map(k => `'${k}`); // 強制文字
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: '統計分析!A1:E5',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          ['統計指標', ...statsHeaderRow],
          avgRow,
          stdRow,
          sharpeRow,
          volRow,
        ],
      },
    });

    // 4. 格式化
    const sheetMeta = (await sheets.spreadsheets.get({ spreadsheetId })).data.sheets;
    const sid0 = sheetMeta.find(s => s.properties.title === '年度報酬率').properties.sheetId;
    const sid1 = sheetMeta.find(s => s.properties.title === '統計分析').properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          { repeatCell: { range: { sheetId: sid0, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 }, textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 12 }, horizontalAlignment: 'CENTER' } }, fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)' } },
          { repeatCell: { range: { sheetId: sid1, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 }, textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 12 }, horizontalAlignment: 'CENTER' } }, fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)' } },
          { updateSheetProperties: { properties: { sheetId: sid0, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
          { updateSheetProperties: { properties: { sheetId: sid1, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
          { updateDimensionProperties: { range: { sheetId: sid0, dimension: 'COLUMNS', startIndex: 0, endIndex: 5 }, properties: { pixelSize: 180 }, fields: 'pixelSize' } },
          { updateDimensionProperties: { range: { sheetId: sid1, dimension: 'COLUMNS', startIndex: 0, endIndex: 5 }, properties: { pixelSize: 180 }, fields: 'pixelSize' } },
        ],
      },
    });

    // 5. 折線圖
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addChart: {
              chart: {
                spec: {
                  title: '各ETF年度含息報酬率趨勢 (2023-2025)',
                  basicChart: {
                    chartType: 'LINE',
                    legendPosition: 'BOTTOM_LEGEND',
                    axis: [
                      { position: 'BOTTOM_AXIS', title: '年度' },
                      { position: 'LEFT_AXIS', title: '報酬率 (%)' },
                    ],
                    domains: [{ domain: { sourceRange: { sources: [{ sheetId: sid0, startRowIndex: 0, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 1 }] } } }],
                    series: [
                      { series: { sourceRange: { sources: [{ sheetId: sid0, startRowIndex: 0, endRowIndex: 4, startColumnIndex: 1, endColumnIndex: 2 }] } }, targetAxis: 'LEFT_AXIS' },
                      { series: { sourceRange: { sources: [{ sheetId: sid0, startRowIndex: 0, endRowIndex: 4, startColumnIndex: 2, endColumnIndex: 3 }] } }, targetAxis: 'LEFT_AXIS' },
                      { series: { sourceRange: { sources: [{ sheetId: sid0, startRowIndex: 0, endRowIndex: 4, startColumnIndex: 3, endColumnIndex: 4 }] } }, targetAxis: 'LEFT_AXIS' },
                      { series: { sourceRange: { sources: [{ sheetId: sid0, startRowIndex: 0, endRowIndex: 4, startColumnIndex: 4, endColumnIndex: 5 }] } }, targetAxis: 'LEFT_AXIS' },
                    ],
                    headerCount: 1,
                  },
                },
                position: { newSheet: true },
              },
            },
          },
        ],
      },
    });

    console.log('✅ 試算表建立完成！');
    console.log(`🔗 https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    return spreadsheetId;
  }

  console.log('Usage:');
  console.log('  node scripts/create-etf-sheet.cjs auth');
  console.log('  node scripts/create-etf-sheet.cjs token <CODE>');
  console.log('  node scripts/create-etf-sheet.cjs create');
}

main().catch(console.error);
