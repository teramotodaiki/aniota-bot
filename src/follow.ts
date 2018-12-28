import * as functions from 'firebase-functions'
import { OutgoingRequestParams } from './slack'
import firestore, { Timestamp, Follow } from './firestore'

export const follow = functions.https.onRequest(async (request, response) => {
  const params = request.params as OutgoingRequestParams
  const [, query] = params.text.split(' ', 2)
  const current = await firestore
    .collection('follows')
    .where('query', '==', query)
    .where('user_id', '==', params.user_id)
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
    channel_id: params.channel_id,
    channel_name: params.channel_name,
    timestamp: params.timestamp,
    user_id: params.user_id,
    user_name: params.user_name,
    text: params.text,
    trigger_word: params.trigger_word
  }
  await firestore.collection('follows').add(follow)
  return response.send({
    text: `You followed ${query}`
  })
})
