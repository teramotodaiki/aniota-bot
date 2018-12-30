import test from 'ava'
import * as syobocal from './syobocal'

test('syobocal TitleLookup API', t => {
  const TID = '5049'
  const url = syobocal.getTitleLookupUrl({
    TID
  })
  t.is(url, 'http://cal.syoboi.jp/db.php?Command=TitleLookup&TID=' + TID)
})

test('syobocal TitleLookup Result', async t => {
  const TID = '5049'
  const [result] = await syobocal.titleLookup({ TID })
  t.is(result.tid, '5049')
  t.is(typeof result.last_update, 'string')
  t.is(result.last_update, '2018-12-23 00:37:59')
  t.is(result.title, 'ソードアート・オンライン アリシゼーション')
  t.is(result.short_title, '')
  t.is(result.title_yomi, 'そーどあーとおんらいんありしぜーしょん')
  t.is(typeof result.comment, 'string')
  t.is(result.title_en, 'SWORD ART ONLINE Alicization')
  if (result.last_update === '2018-12-23 00:37:59') {
    t.is(result.comment, sampleComment())
    t.is(result.url, 'https://sao-alicization.net/') // 変わるかもしれない
  }
})

test('syobocal CalChk API', t => {
  const url = syobocal.getCalChkUrl({
    days: '1'
  })
  t.is(url, 'http://cal.syoboi.jp/cal_chk.php?days=1')
})

test('extract credits', t => {
  const talentNames = ['川原礫', '鈴木豪', '藍井エイル', '戸松遥']
  t.deepEqual(
    syobocal.parseCreditsFromComment(sampleComment(), talentNames),
    sampleCredits()
  )
})

function sampleComment() {
  return `
*リンク
-[[公式 https://sao-alicization.net/]]
-[[ニコニコチャンネル http://ch.nicovideo.jp/sao-alicization]]
-[[バンダイチャンネル https://www.b-ch.com/ttl/index.php?ttl_c=6284]]

*メモ
-4クール予定

*スタッフ
:原作:川原礫(電撃文庫)
:原作イラスト・キャラクターデザイン原案:abec
:監督:小野学
:キャラクターデザイン:足立慎吾、鈴木豪、西口智也
:助監督:佐久間貴史
:総作画監督:鈴木豪、西口智也
:プロップデザイン:早川麻美、伊藤公規
:モンスターデザイン:河野敏弥
:アクション作画監督:菅野芳弘、竹内哲也
:美術監督:小川友佳子、渡辺佳人
:美術設定:森岡賢一、谷内優穂
:色彩設計:中野尚美
:CGディレクター:雲藤隆太
:撮影監督:脇顯太朗、林賢太
:モーショングラフィックス:大城丈宗
:編集:近藤勇二
:音響監督:岩浪美和
:音響効果:小山恭正
:音響制作:ソニルード
:音楽:梶浦由記
:音楽制作:アニプレックス
:プロデュース:EGG FIRM、ストレートエッジ
:制作:A-1 Pictures
:製作:SAO-A Project(アニプレックス、KADOKAWA、バンダイナムコエンターテインメント、GENCO、ストレートエッジ、EGG FIRM)

*オープニングテーマ1「ADAMAS」
:作詞・歌:LiSA
:作曲:カヨコ
:編曲:堀江晶太
:使用話数:#2～
-#1はオープニングテーマなし、オープニング映像をエンディングテーマとして使用

*オープニングテーマ2「RESISTER」
:歌:ASCA

*エンディングテーマ1「アイリス」
:作詞:Eir
:作曲:ArmySlick、Lauren Kaori
:編曲:ArmySlick
:歌:藍井エイル
:使用話数:#2～

*エンディングテーマ2「forget-me-not」
:歌:ReoNa

*挿入歌「longing」
:作詞・作曲・編曲:梶浦由記
:歌:ユナ(神田沙也加)
:使用話数:#5

*キャスト
:キリト(桐ヶ谷和人):松岡禎丞
:アリス:茅野愛衣
:ユージオ:島﨑信長
:セルカ:前田佳織里
:ソルティリーナ・セルルト:潘めぐみ
:ウォロ・リーバンテイン:村田太志
:ライオス・アンティノス:岩瀬周平
:ウンベール・ジーゼック:木島隆一
:ロニエ・アラベル:近藤玲奈
:ティーゼ・シュトリーネン:石原夏織
:エルドリエ・シンセシス・サーティワン:益山武明
:デュソルバート・シンセシス・セブン:花田光

:アスナ(結城明日奈):戸松遥
:リーファ(桐ヶ谷直葉):竹達彩奈
:ユイ:伊藤かな恵
:シノン(朝田詩乃):沢城みゆき
:シリカ(綾野珪子):日高里菜
:リズベット(篠崎里香):高垣彩陽
:クライン(壷井遼太郎):平田広明
:エギル:安元洋貴

:菊岡誠二郎:森川智之
:茅場晶彦:山寺宏一
:神代凛子:小林沙苗
:比嘉タケル:野島健児
:桐ヶ谷翠:遠藤綾
:安岐ナツキ:川澄綾子`.trimLeft()
}

function sampleCredits(): syobocal.Credit[] {
  return [
    {
      name: '川原礫',
      roles: [
        {
          role: '原作',
          group: 'スタッフ'
        }
      ]
    },
    {
      name: '鈴木豪',
      roles: [
        {
          role: 'キャラクターデザイン',
          group: 'スタッフ'
        },
        {
          role: '総作画監督',
          group: 'スタッフ'
        }
      ]
    },
    {
      name: '藍井エイル',
      roles: [
        {
          role: '歌',
          group: 'エンディングテーマ1「アイリス」'
        }
      ]
    },
    {
      name: '戸松遥',
      roles: [
        {
          role: 'アスナ(結城明日奈)',
          group: 'キャスト'
        }
      ]
    }
  ]
}
