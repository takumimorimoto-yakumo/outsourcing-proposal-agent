/**
 * Google Apps Script - スプレッドシートに案件データを書き込む
 *
 * 設置方法:
 * 1. スプレッドシートを開く
 * 2. 拡張機能 > Apps Script を開く
 * 3. このコードを貼り付けて保存
 * 4. デプロイ > 新しいデプロイ > ウェブアプリ
 * 5. アクセス権: 「全員」に設定
 * 6. デプロイしてURLをコピー
 */

// シート名を定数で定義
const SHEET_NAME = 'リスト';

// シートを取得するヘルパー関数
function getTargetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // シートが存在しない場合は作成
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

// POSTリクエストを受け取る
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 削除リクエストの場合
    if (data.action === 'clear') {
      return clearSheet();
    }
    const sheet = getTargetSheet();

    // ヘッダーがなければ追加
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'job_id',
        'title',
        'category',
        'job_type',
        'status',
        'budget_min',
        'budget_max',
        'remaining_days',
        'proposal_count',
        'recruitment_count',
        'client_name',
        'client_rating',
        'url',
        'description',
        'required_skills',
        'tags',
        'feature_tags',
        'scraped_at'
      ]);
    }

    // データが配列の場合は複数行追加
    const jobs = Array.isArray(data) ? data : [data];
    let addedCount = 0;
    let updatedCount = 0;

    jobs.forEach(job => {
      const rowData = [
        job.job_id || '',
        job.title || '',
        job.category || '',
        job.job_type || '',
        job.status || '',
        job.budget_min || '',
        job.budget_max || '',
        job.remaining_days || '',
        job.proposal_count || '',
        job.recruitment_count || '',
        job.client_name || (job.client && job.client.name) || '',
        job.client_rating || (job.client && job.client.rating) || '',
        job.url || '',
        job.description || '',
        (job.required_skills || []).join(', '),
        (job.tags || []).join(', '),
        (job.feature_tags || []).join(', '),
        job.scraped_at || new Date().toISOString()
      ];

      // 既存の job_id を検索
      const lastRow = sheet.getLastRow();
      let existingRowIndex = -1;

      if (lastRow > 1) {
        const existingIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
        existingRowIndex = existingIds.indexOf(job.job_id);
      }

      if (existingRowIndex !== -1) {
        // 既存の行を上書き（行番号は2始まりなので+2）
        const targetRow = existingRowIndex + 2;
        sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
        updatedCount++;
      } else {
        // 新しい行を追加
        sheet.appendRow(rowData);
        addedCount++;
      }
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        count: jobs.length,
        added: addedCount,
        updated: updatedCount
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエスト - データ取得
function doGet(e) {
  try {
    const sheet = getTargetSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ jobs: [], total: 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ヘッダーとデータを取得
    const headers = sheet.getRange(1, 1, 1, 18).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();

    // オブジェクト配列に変換
    const jobs = data.map(row => {
      const job = {};
      headers.forEach((header, index) => {
        let value = row[index];
        // 数値フィールドの変換
        if (['budget_min', 'budget_max', 'remaining_days', 'proposal_count', 'recruitment_count'].includes(header)) {
          job[header] = value === '' ? null : Number(value);
        } else if (header === 'client_rating') {
          job[header] = value === '' ? null : Number(value);
        } else if (['required_skills', 'tags', 'feature_tags'].includes(header)) {
          // カンマ区切り文字列を配列に
          job[header] = value ? value.split(', ').filter(v => v) : [];
        } else {
          job[header] = value || '';
        }
      });
      return job;
    });

    return ContentService
      .createTextOutput(JSON.stringify({ jobs: jobs, total: jobs.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// シートをクリア（ヘッダーは残す）
function clearSheet() {
  try {
    const sheet = getTargetSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      // 2行目以降を削除（ヘッダーは残す）
      sheet.deleteRows(2, lastRow - 1);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'シートをクリアしました',
        deletedRows: lastRow > 1 ? lastRow - 1 : 0
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
