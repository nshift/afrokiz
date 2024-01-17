import { Order } from './order'
import { generate } from './qrCode'

export const confirmationEmail = async (order: Order) => ({
  destinations: [order.email],
  cc: [],
  subject: 'Confirmation of Your AfroKiz Bangkok Edition 2 Early Bird Ticket Purchase',
  html: `
<html>
  <head>
    <style>
      table {
        border-collapse: collapse;
        min-width: 70%;
      }
      table, th, td {
        border: 1px solid;
        padding: 0.3rem;
      }
    </style>
  </head>
  <body>
    Dear ${order.fullname},
    <br />
    <br />Thank you for choosing AfroKiz Bangkok Edition 2 as your festival destination! We are thrilled to confirm your purchase of Early Bird tickets for the upcoming event. Your support means the world to us, and we can't wait to celebrate the vibrant world of AfroKiz with you.
    <br />
    <br />Ticket Includes:
    ${order.items.map((item) =>
      [`<br /> - ${item.title}`].concat(item.includes.map((include) => `<br /> - ${include}`)).join('')
    )}
    <br />
    <br />Event Details:
    <br />  - Festival Name: AfroKiz Bangkok Edition 2 - Date: September 6-8, 2024
    <br />  - Venue: <a href="https://maps.app.goo.gl/deTHk2Euinkho3Pq6">GLOWFISH 92/4, Floor 2, Sathorn Thani 2 Building, Bangkok</a>
    <br />
    <br />Your Transaction Details:
    <br />  - Order Number: ${order.id}
    <br />  - Total Amount: ${Array.from(new Set(order.items.map((item) => item.total.currency)))[0]} ${(
    order.items.reduce((total, item) => (total += item.total.amount), 0) / 100
  ).toFixed(2)}
    <br />
    <br />Important information:
    <br />  - This event pass is non-transferrable.
    <br />  - All tickets are non-refundable.
    <br />  - Kindly be advised that all benefits associated with “Single” typed packages are designed for one person exclusively. Should you wish to extend these privileges to an additional individual and avail all provided services, a surcharge at the designated add-on price will be applicable. - Should you wish to extend these privileges to an additional individual and avail all provided services, please kindly contact us by replying to this email.
    <br />
    <br />What's Next:
    <br />  1. Keep an eye on your inbox: As the festival date approaches, we'll be sending you important updates, artist announcements, and additional event details. Make sure to add [email@example.com] to your contacts to avoid missing any crucial information.
    <br />  2. Save the Date: Mark your calendar for September 6-8 and get ready to experience the energy, music, and dance that AfroKiz Bangkok Edition 2 has to offer.
    <br />  3. Connect with Us: Follow us on social media ([Facebook, Instagram >> afrokizbkk) for the latest news, behind-the-scenes content, and community updates. Share your excitement by using the official event hashtag: #AfroKizBKK2.
    <br />
    <br />If you have any questions or need assistance, feel free to reply to this email or contact our customer support at [customer.support@example.com].
    <br />Once again, thank you for being a part of AfroKiz Bangkok Edition 2. Your presence will contribute to making this festival an unforgettable experience. Get ready to dance, connect, and celebrate the spirit of AfroKiz!
    <br />
    <br />Best regards,
    <br />
    <br />AfroKiz Bangkok Edition 2 Team 
    <br />Whatsapp +66991166561 
    <br />Email: afrokiz.bkk@gmail.com
  </body>
</html>`,
  attachments: [{ filename: 'qr_code.png', content: await generate(order.id) }],
})
