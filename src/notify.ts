import * as functions from 'firebase-functions'
import firestore from './firestore'
import fetch from 'node-fetch'
import { uniq } from 'lodash'

export const notify = functions.https.onRequest(async (request, response) => {
  // slack の情報
  const { slack } = functions.config()
  if (!slack) return response.send(200)
  console.log('webhook url', slack.url)

  const notNotifiedYet = await firestore
    .collection('syobocal_titles')
    .where('is_followed_by_someone', '==', true)
    .where('is_notified', '==', false)
    .limit(1)
    .get()

  for (const titleSnapshot of notNotifiedYet.docs) {
    // そのタイトルのクレジットに載っている人たちの id (talent_id) を全て取得する
    const creditSnapshot = await titleSnapshot.ref.collection('credits').get()
    const creditList = creditSnapshot.docs
    const talentIds = creditList.map(ref => ref.id)
    const talentList = creditList.map(
      ref => ref.get('role') + '：' + ref.get('name')
    )
    const slackUserIds: string[] = [] // そのタレントをフォローしているユーザーの user_id (Slack)
    for (const talent_id of talentIds) {
      const followersSnapshot = await firestore
        .collection('talents')
        .doc(talent_id)
        .collection('followers')
        .get()
      for (const follower of followersSnapshot.docs) {
        slackUserIds.push(follower.get('user_id'))
      }
    }
    const text = [
      titleSnapshot.get('url'), // https://...
      talentList.join('\n'), // 担当：名前...
      uniq(slackUserIds)
        .map(id => `<@${id}>`)
        .join(' ') // @UserA @Userb ...
    ]
    await fetch(slack.url, {
      method: 'POST',
      body: JSON.stringify({
        text,
        unfurl_links: true
      })
    })
    await titleSnapshot.ref.update({
      is_notified: true
    })
  }
  return response.send(200)
})
