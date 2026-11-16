# 我的美食口袋名單

以溫暖手帳風整理「想吃／吃過」的店家。使用原生 HTML、CSS、JavaScript，沒有框架、後端或外部 API。

## 功能

- 六家政大周邊店家及獨立詳細網址。
- 正餐／早午餐／甜點／飲料多分類，搭配想吃／吃過篩選。
- 網頁新增、編輯、確認刪除及切換狀態。
- 餐點、價格與推薦商品。
- 自製 SVG 分類插畫，也可上傳照片。
- 多張菜單、放大查看及官方菜單連結。
- IndexedDB 本機保存、JSON 匯出與匯入，備份包含圖片。
- 手機與電腦響應式排版。

六家店的預算、地址及推薦商品由使用者提供。沒有提供的單品價格不補寫，所有初始菜單顯示「菜單待補充」。

## GitHub Pages 發布（不用安裝套件）

1. 解壓縮專案 ZIP。
2. 在 GitHub 建立新的 **Public Repository**，名稱可用 `food-pocket`。
3. 在 Repository 選 **Add file → Upload files**。
4. 上傳解壓縮後 `food-pocket` 資料夾**裡面的內容**，保留 `assets/`、`data/` 結構。確認 `index.html`、`AGENTS.md`、`README.md` 位在 Repository 根目錄，不要只上傳 ZIP，也不要多包一層資料夾。
5. 按 **Commit changes**。
6. 到 **Settings → Pages → Build and deployment**。
7. Source 選 **Deploy from a branch**；Branch 選 `main`，資料夾選 **/(root)**，按 **Save**。
8. 等 GitHub 顯示發布完成，開啟 Pages 顯示的實際網址。
9. 實測首頁及任一店家頁，確認圖片與資料正常。

這個下載包已準備好發布，但尚未建立 GitHub Repository，也尚未發布 GitHub Pages。

## 本機預覽

不可直接雙擊 `index.html`：瀏覽器會限制 ES modules 與 JSON 讀取。

有 Python 時，在專案根目錄執行：

```bash
python3 -m http.server 8000
```

再開啟 `http://localhost:8000/`。也可使用編輯器的靜態網站預覽工具。

## 儲存與備份

公開資料在 `data/restaurants.json`；網頁新增或修改只存目前瀏覽器，不會更新 GitHub 或其他訪客的網站。

- 修改公開店家以本機版本覆蓋；刪除只隱藏於本機。
- 換裝置、換瀏覽器、換網址來源或清除網站資料都可能看不到原收藏。
- 右上角「備份管理」可匯出 JSON，包含所有目前可見店家、本機修改／隱藏狀態及圖片。
- 匯入時依 ID 合併，重複內容可選保留目前版本或採用備份版本，不清空其他收藏。
- 備份最多 50 MB；照片每張最多 8 MB，菜單最多 10 張。大量圖片可導致容量不足，請及早備份。
- 支援 JPEG、PNG、WebP，圖片會經縮圖壓縮；建議保留原始菜單圖片。

## 之後如何請 AI 擴充

範例：

> 請先閱讀 AGENTS.md，再用我提供的資料新增一家店到 data/restaurants.json。使用新的穩定 ID，沿用原本格式，不補寫未知資訊，並確認分類及詳細頁正常。

同一份版型會依資料自動呈現新店，不需要為每家店複製 HTML。AI 查菜單時依 AGENTS.md 的官方來源、分店確認及日期規則處理。

## 檔案

- `AGENTS.md`：專案規則與驗收清單。
- `index.html`：首頁。
- `restaurant.html`：店家詳細頁。
- `assets/css/style.css`：共用樣式。
- `assets/js/data.js`：共用 UI 與資料操作。
- `assets/js/storage.js`：驗證、IndexedDB 與備份合併。
- `assets/js/app.js`：首頁。
- `assets/js/restaurant.js`：詳細頁。
- `data/restaurants.json`：正式店家內容。

## 驗證紀錄

已完成：

- 四個 JavaScript 檔案的語法檢查。
- 六家資料、唯一 ID、多分類、網址安全與備份衝突策略檢查。
- 桌面瀏覽器實際操作：分類與狀態組合篩選、空結果、新增、編輯、狀態切換、重新整理保存及確認刪除。
- 使用測試圖片實際上傳照片與菜單、放大菜單。
- 匯出備份、刪除測試店後匯入還原，確認餐點、預算、照片、菜單皆恢復。
- 錯誤版本備份被拒絕，既有資料未變動。
- 珍妹地址與推薦商品顯示正確，最後回到六家初始店家。
- 桌面頁面無橫向溢出；網站程式未觀察到執行錯誤。

已加入手機斷點樣式，但尚未在實體手機及 Safari 實測。GitHub Pages 尚未發布，因此上傳後仍需按前述步驟確認實際網址。

測試圖片及測試店家未包含於交付專案。
