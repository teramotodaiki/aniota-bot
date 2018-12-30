import * as functions from 'firebase-functions'

export * from './follow'
export * from './cron'
export * from './talent'
export * from './credit'

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send('Hello from Firebase!')
})
