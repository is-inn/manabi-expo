# App Review 返信用（Guideline 2.1 - Information Needed）

App Store Connect の「App Review」ページで返信し、同じ内容を
「App Reviewに関する情報 → メモ」にも貼り付ける。英語のまま貼る。

## 返信文（英語）

```
Hello App Review team,

Thank you for your message. Here is the information requested for "まなびチーム" (Manabi Team), version 1.0 (build 5).

1. Screen recording
A screen recording captured on a physical iPhone (latest iOS) is attached. It starts from launching the app and shows both usage modes.

2. Purpose and target audience
Manabi Team is a study-time tracking app. It helps people build a daily study habit by measuring study time and recording it.
- "Solo mode" is for anyone studying on their own: stopwatch, countdown timer, a short "what I worked hard on" memo after each session, and a daily goal with a consecutive-day streak.
- "Family mode" is for parents and children: a parent creates tasks (homework), the child studies with the timer and marks tasks done, and the parent can see each child's study time, streak and time per subject.
Target audience: students and adults who want to build a study habit, and families with school-age children.

3. How to set up and access the main features
No account, login or sample file is required. There is nothing to sign in to.
- On first launch, choose "ひとりで使う" (Solo) or "家族で使う" (Family).
- Solo mode: enter a name, then use the "けいそく" tab to start the stopwatch or a countdown timer, finish to add a memo, and view history in the "きろく" tab. The daily goal is set in the Settings tab.
- Family mode: register at least one parent and one child on the welcome screen. The child screen has the timer and tasks. The parent screens (home, tasks, progress, settings) are protected by a simple math question (a two-digit by one-digit multiplication) so that children do not open them by mistake.
Subjects and family members can be freely added, renamed and deleted in Settings.

4. External services, tools and platforms
None. The app does not use any external service, authentication provider, payment processor, analytics, advertising or AI service. All data is stored only on the device (local storage) and is never sent anywhere. The app is built with Expo / React Native.

5. Regional differences
The app functions identically in all regions. There are no regional differences in features or content. (The app is currently released in Japan only; the interface is in Japanese.)

6. Regulated industry / third-party material
The app is not in a regulated industry and contains no protected third-party material. There are no in-app purchases, no user-generated content shared with other users, no accounts, and no account creation (so no account deletion flow is needed).

Thank you for your review.
```

## 日本語の要約（あなた用）

- 1. 実機の画面録画 → 添付する（下の撮影手順）
- 2. アプリの目的と対象 → 勉強時間を計って習慣づくり。ひとり／家族の2モード
- 3. 使い方 → ログイン不要。初回に「ひとり／家族」を選ぶ
- 4. 外部サービス → なし。データは端末内だけ
- 5. 地域差 → なし（現在は日本のみ配信）
- 6. 規制業種・第三者素材 → なし。課金・アカウント・ユーザー投稿もなし

## 画面録画の撮影手順（実機・iPhone）

使うビルド：**TestFlight のビルド5**（ひとりモード入り）。
手元に入っている古いテスト版（家族モードのみ）は使わない。

1. App Store の「TestFlight」アプリを入れ、suibotu0313@gmail.com で招待を受けて、
   「まなびチーム」ビルド5をインストールする。
2. コントロールセンターの「画面収録」を開始する（アプリを起動する前に開始する）。
3. アプリを起動 → 「ひとりで使う」を選ぶ → 名前を入れて始める。
4. 「けいそく」でタイマーを開始 → 数秒後に終了 → 「がんばったこと」メモを入力して保存。
5. 「きろく」で履歴を見せる → 「設定」で毎日の目標を見せる。
6. 設定から使い方を切り替え（または再インストール後）、「家族で使う」を選ぶ。
7. 保護者とこどもを登録 → こどもでタイマーを開始 → ログアウト →
   保護者の画面を開く（計算問題を解く）→ タスクを追加 → 進捗を見せる。
8. 画面収録を止める。1〜2分、長くても3分に収める。
