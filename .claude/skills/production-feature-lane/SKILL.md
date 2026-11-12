---
name: production-feature-lane
description: Code + chạy test tự động cho task Volt POS (app Windows, KHÔNG mobile) trên PRODUCTION theo rule "chung test, riêng hồ sơ" — mọi tiệm (20258, 2949…) không set cứng dữ liệu, Card gom chung cuối cùng và chỉ chạy khi user xác nhận có thẻ charge tiền thật, báo cáo cuối PASS/FAIL/SKIP (SKIP = Card). Dùng khi user nói "triển khai code task VP-xxxx trên production", "check lại các task Verified Production còn pass không", "chạy test production tiệm X", "test:production", "kết quả cuối cùng pass bao nhiêu fail bao nhiêu", hoặc "/production-feature-lane".
---

# Production feature lane (Volt POS Windows)

Một bộ test viết **một lần** (`tests/features/**`) chạy cho **2 môi trường** — staging
(`v2.dev-fastboypay.com`, ENV=dev) và production (`v2.fastboypay.com`, ENV=prod) — và cho
**mọi tiệm**. Khác biệt nằm ở hồ sơ (`configs/profiles`), không nằm trong spec.

## Rule bắt buộc

1. **Chỉ app Volt POS Windows.** Bỏ task Android/P8D/mobile, Portal-only, backend
   ([BE]/[API]/[PHP]/[RUST]/[MCP]), `[Request] Ticket …` sửa data, sự cố 1 đơn cụ thể.
   Catalog: `docs/production/verified-production-catalog.json` (+ `…-excluded.md`).
2. **Không set cứng dữ liệu tiệm.** Spec đọc `profile().data` (thợ, service rẻ, service $25,
   khách test, gift card). Trường trống được **tự dò từ app** lúc bắt đầu run
   (`src/features/discover.ts`): thợ = tile Home đầu tiên, service rẻ = giá thấp nhất trên
   lưới, khách test = tên khớp `TEST_CUSTOMER_PATTERN` (mặc định `^(checkin|qc|test)`),
   gift card active có số dư (chỉ đọc/huỷ). **Không bao giờ tự dò** thứ tiêu tiền thật
   (`giftCardLow`) hay khách thật. Kiểm tra số liệu bằng **bất biến** (tổng = Σ dòng,
   Total = Sale+Tip+Tax, điểm/visit trước–sau), không so với con số cố định.
3. **Kiểm đúng tiệm.** Root hook (`tests/features/setup/prodHooks.ts`) đọc
   `merchantSettingList` của app, khác `STORE_ID` là dừng cả run.
4. **Tiệm thật = read-only.** `configs/profiles/production.<store>.json` có `"readOnly": true`
   (vd 2949 Bee Bee Spa) → mọi TC `writes/settings/card` SKIP. Chỉ mở khi user nói rõ:
   `ALLOW_STORE_WRITES=<store>`. Passcode chỉ lấy từ `configs/env/.env.prod.<store>` —
   không có thì **không đoán** (helper ném lỗi).
5. **Card gom cuối, hỏi trước khi charge.** TC Card viết bằng `cardIt(...)` trong
   `tests/features/zz-card/`. Lần chạy thường chúng SKIP "PENDING Card". Cuối run
   `scripts/production-run.ts` hỏi **"Có thẻ charge tiền thật không?"** (+ xác nhận lần 2);
   có → chạy lại riêng `zz-card` với cờ tiền thật, mỗi giao dịch ≤ $0.50 (`assertCardAmount`);
   không/không có TTY → bỏ qua. Mình (Claude) **không tự trả lời có** — phải là user, ngay lúc đó.
6. **Dọn dẹp + trả setting.** Spec tạo đơn bằng `buildOrder` (Quick Checkout, không bao giờ
   chạm đơn nháp người khác), xoá đơn nháp trong `after`, đọc setting gốc rồi trả lại.
7. **Không SKIP im lặng.** Mọi SKIP phải có lý do (`itNeeds` / `noteSkip`), FAIL chỉ dành cho
   lỗi thật của app — lỗi code test thì sửa code rồi chạy lại.

## Cách thêm task mới

1. Đọc task Linear (POS Windows?) → xác định bất biến quan sát được trên POS.
2. Dò live bằng MCP `volt-app` (CDP 9222): `browser_evaluate` / `browser_run_code_unsafe`,
   đọc data qua `window.__TAURI_INTERNALS__.invoke('graphql',…)`. Màn bị khoá passcode → nhập
   từng số qua DOM click.
3. Viết `it` trong spec theo vùng (`tests/features/<area>/…spec.ts`), **tên TC chứa mã VP**
   (`'RPT-03 (VP-4028/4555) …'`) — bảng tổng kết map TC → task theo mã này.
   - Chỉ đọc: `itNeeds([], …)`; tạo đơn: `itNeeds(['writes'], …, ['staffA','cheap'])`;
     đổi setting: `['settings']`; Card: `cardIt(…)` trong `zz-card`.
4. Helper dùng chung: `src/features/pos.ts` (go, click, buildOrder, checkout, split, reopen,
   gql, capturePrint…), `settings.ts`, `customerCdp.ts` (màn khách), `discover.ts`.
5. Chạy suite: `npm run test:production:suite <folder> -- --no-ask` → sửa tới khi chỉ còn lỗi thật.

## Chạy

```bash
npm run prod:app                                   # mở app prod có CDP 9222 (nếu chưa mở)
npm run test:production                            # tiệm 20258: chạy hết, cuối hỏi Card
npm run test:production -- --store 2949            # tiệm khác (app phải đang đăng nhập tiệm đó)
npm run test:production:suite reports -- --no-ask  # 1 thư mục, không hỏi Card
npm run test:production:card                       # chỉ nhóm Card (hỏi thẻ trước)
npm run production:summary                         # bảng tổng kết lần chạy gần nhất
```

Staging: `npm run test:staging:features` (cùng spec, hồ sơ staging).

## Báo cáo cuối (trả user, tiếng Việt)

Đọc `reports/production/<runId>-summary.md` (FeatureResultReporter gom mọi worker):

- Bảng theo project: Total / PASS / FAIL / **SKIP (Card)** / SKIP (khác + lý do).
- Mục **Verified Production tasks (catalog)**: số task PASS / FAIL / SKIP / chưa tự động hoá.
- Mỗi FAIL: phân loại **lỗi app thật** (kèm mã đơn, số liệu) hay lỗi code test (đã sửa).
  Lỗi thật → đề nghị tạo sub task bug (`/qc-verify-production` template), không tự tạo nếu
  user chưa đồng ý.

## Gotcha

- WDIO phải `'wdio:enforceWebDriverClassic': true` (BiDi làm màn khách về about:blank).
- Mã `OD…` trần trong `<main>` là sidebar; đơn đang mở là `#OD…`. Service cũng nằm trên
  thẻ sidebar → click phần tử khớp **cuối**.
- Report V4 nhận `?after=YYYY-MM-DD&before=YYYY-MM-DD`; Week/Month chuyển sang cả năm
  (`period=weekly`). "Today" theo **giờ máy**, không theo giờ tiệm.
- Pay 1 nhiều mức trong kỳ → "Pay 1(Total Income x Pay 1 Rate)" + 1 dòng/kỳ (đúng thiết kế).
- Lần chạy WDIO 1 worker/spec → `dashboard/latest.json` chỉ giữ worker cuối; dùng
  `reports/<target>/runs/<runId>/` thay thế.
