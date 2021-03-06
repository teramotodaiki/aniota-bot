import { initializeApp, firestore } from 'firebase-admin'
import * as syobocal from './syobocal'
import * as talent from './talent'

// Initialize the default app
// Cloud Functions 上で実行されるときは $FIREBASE_CONFIG にデフォルトの認証情報が入っている
initializeApp()

const db = firestore()
db.settings({ timestampsInSnapshots: true }) // 新しい Timestamps の設定

export default db

export const Timestamp = firestore.Timestamp

export interface Talent extends firestore.DocumentData, talent.Talent {
  created_at: firestore.Timestamp
  updated_at: firestore.Timestamp | null
}

export interface Follower extends firestore.DocumentData {
  created_at: firestore.Timestamp
  updated_at: firestore.Timestamp | null
  channel_id: string
  channel_name: string
  timestamp: string
  user_id: string
  user_name: string
  text: string
}

export interface SyobocalTitle
  extends firestore.DocumentData,
    syobocal.TitleLookupResult {
  is_followed_by_someone: boolean
  is_notified: boolean
}

export interface Credit extends firestore.DocumentData, syobocal.Credit {
  talent_id: string
}
