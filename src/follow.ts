import * as functions from 'firebase-functions'
import { OutgoingRequestBody } from './slack'
import firestore, { Timestamp, Follow } from './firestore'

export const follow = functions.https.onRequest(async (request, response) => {
  const body = request.body as OutgoingRequestBody
  const [, query] = body.text.split(' ', 2)
  const current = await firestore
    .collection('follows')
    .where('query', '==', query)
    .where('user_id', '==', body.user_id)
    .limit(1)
    .get()
  if (!current.empty) {
    return response.send({
      text: `You've followed ${query}`
    })
  }
  const follow: Follow = {
    query,
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
  await firestore.collection('follows').add(follow)
  return response.send({
    text: `You followed ${query}`
  })
})
