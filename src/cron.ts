import * as functions from 'firebase-functions'
import * as syobocal from './syobocal'
import firestore, { SyobocalTitle, Credit } from './firestore'
import * as moment from 'moment'
import { includes, toPairs, keys } from 'lodash'
import * as talent from './talent'

const categoryFilter = [
  syobocal.TitleCategory.アニメ,
  syobocal.TitleCategory.OVA,
  syobocal.TitleCategory.映画
] // TODO: 要検討

export const cron = functions.https.onRequest(async (request, response) => {
  console.log('start')
  // syobocal からタイトル一覧を取得 (最終更新日時が３日以内のタイトルを一括取得）
  const since = moment().subtract(3, 'days')
  const result = await syobocal.titleLookup({
    TID: '*',
    LastUpdate: since.format('YYYYMMDD_000000-')
  })
  console.log(`fetched ${result.length} titles`)
  result.splice(100) // バッチ処理できる最大数が 500 程度なので, 一度にセットするドキュメント数を絞る

  await talent.initializeTalents // タレントの初期ロードが終わるのを待つ

  const batch = firestore.batch()
  for (const item of result) {
    if (!includes(categoryFilter, item.cat)) continue // カテゴリで弾く
    const titleRef = firestore.collection('syobocal_titles').doc(item.tid)

    // フォロー中のタレントが含まれるクレジットを抽出
    const credits = syobocal.parseCreditsFromComment(
      item.comment,
      talent.talents
    )
    // バッチで追加
    for (const [talent_id, credit] of toPairs(credits)) {
      const creditRef = titleRef.collection('credits').doc(talent_id) // タレント一意になるように id を同じにする
      const creditDoc: Credit = {
        ...credit,
        talent_id
      }
      batch.set(creditRef, creditDoc)
    }

    const title: SyobocalTitle = {
      ...item,
      isFollowedSomeone: keys(credits).length > 0,
      isNotified: false
    }
    batch.set(titleRef, title, {
      mergeFields: keys(item)
    }) // 取得したデータは merge するが, 状態は merge せずに今のままを保つ
  }
  await batch.commit()
  return response.send(200)
})
