import * as functions from 'firebase-functions'
import * as syobocal from './syobocal'
import firestore, { SyobocalTitle, Timestamp } from './firestore'

export const cron = functions.https.onRequest(async (request, response) => {
  // syobocal から番組表を取得 (before がないので, 放送日が今日以降３０日以内の番組を全て取得)
  const result = await syobocal.calChk({ days: '30' })
  const batch = firestore.batch()
  for (const item of result) {
    const ref = firestore.doc(`syobocal_titles/${item.tid}`)
    const current = await ref.get()
    if (!current.exists) {
      // id=tid が存在しなければ追加
      const result = await syobocal.titleLookup({ TID: item.tid })
      const title: SyobocalTitle = {
        ...result,
        created_at: Timestamp.now(),
        updated_at: null
      }
      batch.create(ref, title)
    }
  }
  await batch.commit()
})
