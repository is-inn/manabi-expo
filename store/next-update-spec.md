# まなびチーム 次期アップデート 実装指示書（Claude Code 向け・2026-11-01）

確定した仕様を、**現在のコード（Expo SDK 57 / React Native / expo-router, v1.0.1）に合わせて**落とし込んだもの。
元の仕様メモには「Next.js・Tailwind・Firebase」とあるが、**このアプリには存在しない**。下の「前提の食い違い」を先に読むこと。

## 0. 前提の食い違い（重要）

| 仕様メモの記述 | 実際のコード | 影響 |
|---|---|---|
| Next.js / React / Tailwind CSS | Expo + React Native + expo-router。スタイルは StyleSheet | UIは StyleSheet で書く。Tailwind は無い |
| Firebase 認証が確認済み | 認証・サーバー・Firebase は一切無い。データは端末内 AsyncStorage（`manabi:appState:v2`）だけ | 「匿名認証」は新規のバックエンド導入になる |
| タイムライン・スタンプ・コメント | 無い | 今回は作らない |
| 親子は別アカウント | 1台の端末で、親と子を切り替えて使う（`state.users` + `currentUser`） | 「子供が親の状況を見る」は同一端末内の画面追加で実現できる |

### 匿名認証についての判断（要確認・推奨案）
- すでに公開・申告している内容は「外部サービスなし・データは端末内のみ」: App Store 審査への返信、プライバシーポリシー、Play のデータセーフティ、ASC のプライバシー回答。
- Firebase 匿名認証を今回入れると、通信と識別子の収集が発生し、これらをすべて直す必要がある（再審査リスクあり）。
- **推奨: 今回は端末内だけで「引き継ぎできるデータ設計」を作る。Firebase 接続は別リリースにする。**
  - `AppState` に `accountId`（初回起動時に作る UUID）を追加。学習記録は従来どおり `userId` で紐付け、`accountId` は将来の認証連携用の「所有者ID」。
  - 将来 Firebase の uid や メール/Google に連携するときは、`accountId` を「引き継ぎ元」として渡せる。
  - 今回、通信・SDK は追加しない。
- 本人が「今回からFirebaseを入れる」と決めた場合は、実装前に上記の申告・ポリシーの更新を先に行うこと。

## 1. 現状（実装済み）

- `src/types/index.ts`: `User{id,name,role,avatar}`, `Subject{id,name,color}`, `Task{...assignedTo,completed}`, `StudySession{userId,subject,duration,date,note}`, `SoloProfile{name,goalMinutes}`, `TimerState`。
- `src/hooks/AppContext.tsx`: reducer + AsyncStorage 永続化。`sanitize()` で壊れたデータを弾く。`STORAGE_KEY = manabi:appState:v2`（v1 は掃除のみ）。
- 親の自習: `app/parent/self.tsx`（`StudyTimer` に `showHistory`）。**v1.0.1 で実装済み**。親タブ: ホーム/じぶん/タスク/進捗/設定。
- 子どもの画面: `app/child/{home,tasks,timer}.tsx`。ホームは自分の合計時間・連続日数・残りタスクのみ。
- 科目は家族共通 (`state.subjects`)。タスク・記録は**科目名**で紐づく。`DELETE_SUBJECT` は最後の1つを消せない（連鎖削除なし）。同名の科目は作れない。
- 目標時間は**ひとりモードだけ**（`state.solo.goalMinutes`、1日あたり、最大600分）。家族モードの親には目標が無い。

## 2. 開発項目（元のNo.に対応）

### No.1 親の学習目標設定（新規）
- 型: `GoalSetting { userId; title?: string; weeklyMinutes: number; deadline?: string(YYYY-MM-DD) }`、`AppState.goals: GoalSetting[]`。
- アクション: `SET_GOAL` / `DELETE_GOAL`。ユーザー削除時に連鎖削除（`DELETE_USER` に追加）。
- 画面: `app/parent/self.tsx` の上部に目標カード（今週の時間・目標時間・達成率・期限までの日数）。編集モーダルは既存の `GoalStepper` を流用。
- 週の区切りは `src/utils/helpers.ts` に関数を追加（月曜はじまりで統一）。

### No.2 親専用タイマー（確認・拡張）
- 既に `parent/self.tsx` で動作。確認事項: タイマー状態 `timerState.sessionUserId` が親の id で正しく保存されること、子どもと同時に実行しないこと（`timerState` は1つだけ）。
- 拡張: 目標カードと同じ画面で「今週の合計」を即時反映。

### No.3 親の学習状況を子どもに表示（新規）
- 画面: `app/child/` に「おうちの人」タブ（`child/_layout.tsx` にタブ追加、`app/child/family.tsx`）。
- 親が複数いる場合は親ごとに1カード。表示項目は No.4 の公開設定に従う: 累計時間 / 今週の時間 / 目標・達成率 / 学習科目 / タスク内容 / タスク別時間。
- 非公開の項目は**描画しない**（空欄ではなく項目ごと非表示）。すべて非公開なら「公開されている項目はありません」を表示。
- 集計は既存 `getTotalStudyTime` を流用し、`helpers.ts` に今週・科目別の集計を追加。

### No.4 公開範囲カスタマイズ（新規）
- 型: `ParentVisibility { total, week, goal, subjects, tasks, taskTime: boolean }` を親ごとに保持。`AppState.visibility: Record<userId, ParentVisibility>`。
- 初期設定: 親の新規登録時（`MemberForm`）に選ばせる。既存の親（v2からの移行）は**全部非公開**を初期値にする（勝手に見せない）。
- 後から変更: `app/parent/settings.tsx` にスイッチ6つ。
- 親の記録は非公開でも通常どおり保存する（表示だけを制御）。

### No.5 中高生向け科目セット / No.6 ワンタップ科目登録（新規）
- `src/utils/defaults.ts` に `SUBJECT_PRESETS` を追加:
  - 中学5教科(国語・数学・英語・理科・社会) / 中学9教科(+音楽・美術・保健体育・技術家庭)
  - 高校5教科(国語・数学・英語・理科・地歴公民) / 共通テスト(国語・地歴公民・数学・理科・外国語・情報Ⅰ)
  - 中学受験(国語・算数・理科・社会) / 高校受験3教科・5教科 / 大学受験 文系・理系
- 画面: `SubjectsSection`（設定内）に「セットから追加」。選択 → プレビュー → 採用。**既存科目を壊さない**ため、デフォルトは「追加（同名はスキップ）」。「置き換え」は確認モーダルを出す。
- 同名科目の重複は reducer が拒否するので、プリセット適用は複数の `ADD_SUBJECT` を一括で行う新アクション `ADD_SUBJECTS` を作る。色は `SUBJECT_PALETTE` を順に割り当て。
- 追加・削除・名前変更は既存のまま使える。「自分だけのセットの保存」は今回は見送り可（後回しでよい）。

### No.7 UI・デザイン改善（検討）
- 今回はNo.1〜6の画面の見た目を既存トーン（青 #4f9cf9、角丸16〜20、カード）にそろえるだけに留める。

### No.8 匿名認証・将来の認証連携（仕様確定 → 端末内のID設計のみ）
- 上記「判断」のとおり。`accountId` を追加し、データ移行（下記）を実装。

### No.9 広告導入（将来対応）
- 今回は広告SDKを入れない。表示位置の差し込み用に、何も描画しない `src/components/AdSlot.tsx`（props: placement）だけ作ってもよい。
- 将来入れる前の確認: Google Play ファミリーポリシー、Apple Kids/13歳未満の扱い、COPPA/個人情報保護。対象年齢の申告との整合。

## 3. データ移行（壊さないこと）

1. `STORAGE_KEY` を `manabi:appState:v3` にし、**v2 を読み込んで変換**する（v2 は消さず、v3 保存後に掃除）。
2. 追加フィールドの初期値: `accountId`=新UUID, `goals=[]`, `visibility={}`（親は全部非公開）。
3. `sanitize()` に新フィールドの検証を追加（壊れていても落とさない）。
4. 家族モード・ひとりモードの既存データ（users / tasks / studySessions / solo）は変更しない。
5. テスト: v2 のデータを手で入れた状態で起動し、記録が全部残ること。

## 4. リリース時の注意

- バージョン 1.1.0。iOS は新ビルド + 審査。プライバシーポリシー（`C:\dev\projects\privacy-policy`）の内容は「端末内のみ」のままで矛盾しないか確認。
- スクリーンショット・ストア文の更新（親の目標・おうちの人タブ・科目セット）。
- 「子ども向けアプリでない/13歳未満の扱い」の申告と、子どもが親のデータを見る機能の表現の整合を確認。

## 5. 実装順（おすすめ）

1. 型・reducer・v3移行（accountId, goals, visibility, ADD_SUBJECTS）
2. 科目プリセット（No.5/6、単体で出せる）
3. 親の目標 + 自習画面（No.1/2）
4. 公開設定 + 子どもの「おうちの人」タブ（No.3/4）
5. 動作確認（`テスト画面を起動.bat` / Web）→ preview ビルド → 実機
