import * as functions from 'firebase-functions'
import { SyobocalTitle, Credit, Timestamp } from './firestore'
import * as syobocal from './syobocal'
import * as talents from './talent'
import { toPairs } from 'lodash'

export const addCreditsWhenCreatedSyobocalTitles = functions.firestore
  .document('syobocal_titles/{tid}')
  .onCreate(async (snapshot, context) => {
    const title = snapshot.data() as SyobocalTitle
    console.log(snapshot.id, title.title)
    await talents.initializeTalents

    // 初期ロードが終わるまで待って, フォロー中のタレントが含まれるクレジットを抽出
    const credits = syobocal.parseCreditsFromComment(
      title.comment,
      talents.talents
    )
    // バッチで追加
    const batch = snapshot.ref.firestore.batch()
    for (const [talent_id, credit] of toPairs(credits)) {
      const ref = snapshot.ref.collection('credits').doc()
      const creditDoc: Credit = {
        ...credit,
        talent_id,
        created_at: Timestamp.now(),
        updated_at: null
      }
      batch.create(ref, creditDoc)
    }
    await batch.commit()
  })
