import * as functions from 'firebase-functions'
import * as syobocal from './syobocal'
import firestore, { SyobocalTitle, Credit } from './firestore'
import * as moment from 'moment'
import { includes, toPairs, keys, omit } from 'lodash'
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

  // 必要になるデータを事前に取得して, 追加すべきデータの配列にしておく
  const newTitles: {
    result: syobocal.TitleLookupResult
    ref: FirebaseFirestore.DocumentReference
    credits: { [key: string]: syobocal.Credit }
    is_notified: boolean
  }[] = []
  for (const item of result) {
    if (!includes(categoryFilter, item.cat)) continue // カテゴリで弾く
    const ref = firestore.collection('syobocal_titles').doc(item.tid)
    const titleSnapshot = await ref.get()
    const currentCreditList = await ref.collection('credits').listDocuments()
    const currentCreditIds = currentCreditList.map(ref => ref.id)
    const allCredits = syobocal.parseCreditsFromComment(
      item.comment,
      talent.talents
    ) // フォロー中のタレントが含まれるクレジットを抽出
    const credits = omit(allCredits, currentCreditIds) // 既にあるものを除く
    const is_notified = Boolean(titleSnapshot.get('is_notified')) // 初期値は false
    newTitles.push({
      result: item,
      ref,
      credits,
      is_notified
    })
  }
  console.log(`prepare ${newTitles.length} titles`)

  await talent.initializeTalents // タレントの初期ロードが終わるのを待つ

  // バッチで追加
  const batch = firestore.batch()
  for (const { ref, result, credits, is_notified } of newTitles) {
    for (const [talent_id, credit] of toPairs(credits)) {
      const creditRef = ref.collection('credits').doc(talent_id) // タレント一意になるように id を同じにする
      const creditDoc: Credit = {
        ...credit,
        talent_id
      }
      batch.set(creditRef, creditDoc)
    }
    const title: SyobocalTitle = {
      ...result,
      is_followed_by_someone: keys(credits).length > 0,
      is_notified
    }
    batch.set(ref, title)
  }
  await batch.commit()
  return response.send(200)
})
