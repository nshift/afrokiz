const express = require('express')
const app = express()

app.post('/webhook', express.json({ type: 'application/json' }), (request, response) => {
  const event = request.body

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object
      console.log('payment_intent.succeeded: ', paymentIntent)
      break
    case 'payment_method.attached':
      const paymentMethod = event.data.object
      console.log("'payment_method.attached: ", paymentMethod)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  response.json({ received: true })
})

app.listen(4242, () => console.log('Running on port 4242'))
