import { initializeApp, firestore } from 'firebase-admin'

// Initialize the default app
// Cloud Functions 上で実行されるときは $FIREBASE_CONFIG にデフォルトの認証情報が入っている
initializeApp()

const db = firestore()
db.settings({ timestampsInSnapshots: true }) // 新しい Timestamps の設定

export default db

export const Timestamp = firestore.Timestamp

export interface Follow extends firestore.DocumentData {
  query: string
  created_at: firestore.Timestamp
  updated_at: firestore.Timestamp | null
  channel_id: string
  channel_name: string
  timestamp: string
  user_id: string
  user_name: string
  text: string
  trigger_word: string
}
