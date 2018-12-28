import * as functions from 'firebase-functions'

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const follow = functions.https.onRequest((request, response) => {
  console.log(request.params)
  console.log(request.query)
  console.log(request.body)
  return response.send({
    text: Date.now()
  })
})
