import * as functions from 'firebase-functions'
import * as syobocal from './syobocal'
import firestore, { SyobocalTitle, Timestamp } from './firestore'
import * as moment from 'moment'

export const cron = functions.https.onRequest(async (request, response) => {
  console.log('start')
  // syobocal からタイトル一覧を取得 (最終更新日時が７日以内のタイトルを一括取得）
  const since = moment().subtract(7, 'days')
  const result = await syobocal.titleLookup({
    TID: '*',
    LastUpdate: since.format('YYYYMMDD_000000-')
  })
  console.log(`fetched ${result.length} titles`)
  result.splice(500) // バッチ処理可能な限界 ref. https://firebase.google.com/docs/firestore/manage-data/transactions?authuser=0#batched-writes
  const batch = firestore.batch()
  for (const item of result) {
    const ref = firestore.doc(`syobocal_titles/${item.tid}`)
    const current = await ref.get()
    if (!current.exists) {
      // id=tid が存在しなければ追加
      const title: SyobocalTitle = {
        ...item,
        created_at: Timestamp.now(),
        updated_at: null
      }
      batch.create(ref, title)
    }
  }
  await batch.commit()
  return response.status(200)
})
