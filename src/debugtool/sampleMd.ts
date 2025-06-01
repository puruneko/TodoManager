import { format } from "date-fns"

const dt = (y = 0, M = 0, d = 0, h = 0, m = 0) => {
    const now = new Date(Date.now())
    now.setHours(8)
    now.setMinutes(0)
    now.setFullYear(now.getFullYear() + y)
    now.setMonth(now.getMonth() + M)
    now.setDate(now.getDate() + d)
    now.setHours(now.getHours() + h)
    now.setMinutes(now.getMinutes() + m)
    return `${format(now, "yyyy-MM-dd")}T${format(now, "HH:mm")}`
}
const now = () => {
    return dt()
}
const ymd = (y, M, d) => {
    return dt(y, M, d)
}
const d = (d) => {
    return dt(0, 0, d)
}
const dhm = (d, H = 0, m = 0) => {
    return dt(0, 0, d, H, m)
}
const hm = (H, m = 0) => {
    return dt(0, 0, 0, H, m)
}

//
//

export const debugMdForGantt = `
for gantt

# PJ planning
- [ ] マーケット調査 #plan:${now()}~${1}
- [ ] 検討  #plan:${now()}~${dhm(1)}
- [ ] 報告 #plan:${now()}~${d(1)} #due:${d(1)}
# PJ management
- [ ] リソース管理 #plan:${d(2)}~${d(3)}
- [ ] チーム管理 #plan:${d(3)}~${d(5)}
- [ ] 資産管理 #plan:${d(5)}~${d(6)}
- [ ] 報告 #plan:${d(6)}~${d(7)} #due:${d(7)}
# dev
- [ ] 工程１ #plan:${d(8)}~${d(9)}
- [ ] 工程２ #plan:${d(9)}~${d(14)}
- [ ] 工程３ #plan:${d(9)}~${d(11)}
- [ ] 報告 #plan:${d(11)}~${d(15)} #due:${d(15)}


`

//
//

export const debugMdTextSimple = `
sample1 #tag_1
sample2 #tag_2
`
export const debugMdTextSimple2 = `｜aaa《AAA》

linetext #sharp1~a..a-a~tag1 #sharp2~a..a-a~tag2:valuesample~a..a-a~tag2
linetext //slashed1~a..a-a~tag1 //slashed2~a..a-a~tag2:valuesample~a..a-a~tag2
linetext +plus1~a..a-a~tag1 +plus2~a..a-a~tag2:valuesample~a..a-a~tag2


# PJ1
- [ ] task1_*BOLD*_~DELETE~_ #TAGtask10 #TAGtask10_2
    - DESCRIPTION(1-1)*bold*EOL
    - DESCRIPTION(1-2)
- [ ] task2 #TAGtask20 #TAGtask2
    - DESCRIPTION(2-1)
    - DESCRIPTION(2-2)
## PJ1-2
- [x] task3 #TAGtask30 #plan:2025-5-12T15:00..2025-5-12T16:00
    - DESCRIPTION(3-1)
    - DESCRIPTION(3-2)
- [ ] task4 #TAGtask40
    - DESCRIPTION(4-1)
    - DESCRIPTION(4-2)
# PJ2
- [ ] task5 #TAGtask50 #plan:2025-5-12T10:00..2025-5-12T11:00 #due:2025-5-14T10:00
    - DESCRIPTION(5-1)
    - DESCRIPTION(5-2)
`

export const debugMdText = `
# PCMC運用整理
-検討事項
-  [x] PPF/PV直下での端末費用の振りわけ方法
- 発注時に端末費用は支払する
- 発注時は利用者決まっていないので、ARTを割り当てるが、そのあと利用者決定した時点でどうするか
- 【案】在庫運用で再利用前提なので、人数比で組織を割り当てて発注。以後在庫では各端末がどの組織の割り当てか気にせずに配布。利用者変更申請に組織情報は必要ないので、発注時はすべてARTでもOKで、請求先ごとに発注申請する。
-→納品オフィスで振り分けに決定
-質問事項
-  [x] 出向について
I
- →出向先OK
- 資料作成
- [x] 新運用の草案作成（たたき台） 112025/3/18 +WIP +IMP +today
- 社員順次配布について
-あまりにも軽いので、故障交換してPCMC版になった人の周りで交換依頼が続出する予想。バラバラ交換対応は面倒だし「依頼を出せば総務は好きな端末に交換してくれる」というイメージを持たれるのは嫌なので、希望調査を行って一括交換しこのタイミングでしか故障以外の交換はNGとしたい。また、予算の関係で全員には配布できないので、役職順に希望調査することで、不公平感をなくす。
-社員が使っていたCP版を回収することで、協働者へ配布できる在庫が増やせる。
-  [x] たたき台からNNNNT説明資料を作成/12025/3/14


-[ ] ふぁるさん添削資料をNNNNT説明資料に修正+today
-[ ] ふぁるさんからの質問に回答 +today
＃在庫チェック
-surface pro 10のtopへの希望調査
-[ ] topへ配布
# win11対応
- [x]  win11メディア
- [x] 手順書
-[ ] win11初期在庫の必要数の算出 +WIP
-あまりにも多いようだったら作業の外部委託も検討！
- [ ] オフィスNWへ必要数の返事
-[ ] 在庫win11化の作業
-[ ] 受け入れT説明
- [ ] 全体周知
-[ ] win11の払い出し開始
# さくさんHR転用
- さくさんのtop用版セキュアFATの転用状況
-[ ] さくさんに確認
- HRからもらったセキュアFATの転用書
-担当者はQさん
-[ ] 転用書もらえていないのでさくさんに確認


#PCMC導入
- PCMCと運用整理
- [x] 在庫持つのOKかの返事をもらう
- OK
・ [x] C&P運用で在庫の件以外で問題が無いか確認してもらう +待ち
- 11/25週に回答もらえる
- [ ] 回答状況の確認+WIP
- [x] PCMCポータルの影響調査とC&P資料の見直しポイントの確認+WIP
- コンサルからの打ち合わせ依頼
-  [x] 打合せ日の調整
- 端末購入（お試し）
-PCMCに10台くらい一括発注してみる
- [x]  申請方法確認
- [x] 申請書作成
- [x] 申請
- [x] 申請完了+WIP
-  [x] 納品
- 端末が来たら運用を確認する
-  [x] 利用者の一括変更
- ARTから、さくさんふぁるさん

`
