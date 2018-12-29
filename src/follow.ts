import * as functions from 'firebase-functions'
import { firestore as Firestore } from 'firebase-admin'
import { OutgoingRequestBody } from './slack'
import firestore, { Timestamp, Talent, Follow } from './firestore'

export const follow = functions.https.onRequest(async (request, response) => {
  const body = request.body as OutgoingRequestBody
  const [, talentName] = body.text.split(' ', 2)
  console.log(body)
  // "name" を含むタレントを取得または作成する
  let talentRef: Firestore.DocumentReference
  await firestore.runTransaction(async t => {
    const query = firestore
      .collection('talents')
      .where('name', '==', talentName)
      .limit(1)
    const querySnapshot = await t.get(query)
    if (querySnapshot.empty) {
      const talent: Talent = {
        name: talentName,
        created_at: Timestamp.now(),
        updated_at: null
      }
      talentRef = await firestore.collection('talents').add(talent)
    } else {
      talentRef = querySnapshot.docs[0].ref
    }
  })
  console.log(talentRef.id)
  // タレントに紐づいたフォロワーを作成する
  await firestore.runTransaction(async t => {
    const query = talentRef
      .collection('follows')
      .where('user_id', '==', body.user_id)
      .limit(1)
    const querySnapshot = await t.get(query)
    if (querySnapshot.empty) {
      const follow: Follow = {
        created_at: Timestamp.now(),
        updated_at: null,
        channel_id: body.channel_id,
        channel_name: body.channel_name,
        timestamp: body.timestamp,
        user_id: body.user_id,
        user_name: body.user_name,
        text: body.text,
        trigger_word: body.trigger_word
      }
      const followRef = await talentRef.collection('follows').add(follow)
      console.log('add follow', followRef.id)
    } else {
      console.log('exist follow', querySnapshot.docs[0].id)
    }
  })

  return response.send({
    text: `You're following ${talentName}. @${body.user_name}`
  })
})
