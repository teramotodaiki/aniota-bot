import * as functions from 'firebase-functions'
import { firestore as Firestore } from 'firebase-admin'
import { OutgoingRequestBody } from './slack'
import firestore, { Timestamp, Talent, Follower } from './firestore'

export const follow = functions.https.onRequest(async (request, response) => {
  const body = request.body as OutgoingRequestBody
  console.log(body)
  const talentName =
    body.text.indexOf('follow ') === 0
      ? body.text.split(' ', 2)[1] // Outgoing Webhook "follow X"
      : body.text // Command /follow
  console.log(talentName)

  // "name" を含むタレントを取得または作成する
  let talentRef: Firestore.DocumentReference
  const talentResult = await firestore
    .collection('talents')
    .where('name', '==', talentName)
    .limit(1)
    .get()
  if (talentResult.empty) {
    const talent: Talent = {
      name: talentName,
      created_at: Timestamp.now(),
      updated_at: null
    }
    talentRef = await firestore.collection('talents').add(talent)
  } else {
    talentRef = talentResult.docs[0].ref
  }
  console.log(talentRef.id)
  // タレントに紐づいたフォロワーを作成する
  const followerResult = await talentRef
    .collection('followers')
    .where('user_id', '==', body.user_id)
    .limit(1)
    .get()
  if (followerResult.empty) {
    const follower: Follower = {
      created_at: Timestamp.now(),
      updated_at: null,
      channel_id: body.channel_id,
      channel_name: body.channel_name,
      timestamp: body.timestamp,
      user_id: body.user_id,
      user_name: body.user_name,
      text: body.text
    }
    const followerRef = await talentRef.collection('followers').add(follower)
    console.log('add follower', followerRef.id)
  } else {
    console.log('following', followerResult.docs[0].id)
  }

  return response.send({
    text: `You're following ${talentName}. <@${body.user_id}>`
  })
})
