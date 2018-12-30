import * as functions from 'firebase-functions'
import firestore from './firestore'

export interface Talent {
  name: string
}

// コレクションに乗っているタレント情報をメモリに載せる
export const talents: { [id: string]: Talent } = {}
export const initializeTalents = firestore
  .collection('talents')
  .get()
  .then(snapshot => {
    for (const doc of snapshot.docs) {
      talents[doc.id] = doc.data() as Talent
    }
  }) // 初期ロードが終わるまでは待ちたいときに使う

export const talentCreated = functions.firestore
  .document('talents/{talent_id}')
  .onCreate(async (snapshot, context) => {
    talents[snapshot.id] = snapshot.data() as Talent // メモリに載せる
  })
