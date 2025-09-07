import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { Sales } from '../../entities/sales'
import { GuestCheckIn } from '../../guest-check-in'
import { GuestRegistration } from '../../guest-registration'
import { SalesReporting } from '../../sales.reporting'
import { SametRegistration } from '../../samet-registration'
import { DynamoDbAdapter } from '../dynamodb/dynamodb'
import { SESEmailService } from '../email/ses'
import { preGuestRegistrationEmailTemplate } from '../email/email.pre-registration'
import { Currency } from '../../entities/currency'

const repository = new DynamoDbAdapter(
  DynamoDBDocumentClient.from(new DynamoDB({}), {
    marshallOptions: { removeUndefinedValues: true },
  })
)
const salesReporting = new SalesReporting(repository)

export const makeAllSalesReport = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const salesReport = await salesReporting.makeAllSalesReport()
    return successCSVResponse(
      convertToCSV(
        salesReport.sales
          .flatMap((sale) => {
            const makeRow = (sale: Sales) => ({
              id: sale.id,
              Date: sale.date.toISOString().split('T')[0],
              Email: sale.email,
              Name: sale.fullname,
              Pass: sale.pass,
              'Dancer type': sale.customerType,
              Payment: sale.paymentStatus as string,
              'Koh Samet':
                sale.includes.includes('All workshops at Bangkok and Koh Samet') ||
                sale.includes.includes('All workshops at Koh Samet') ||
                sale.includes.includes('Includes all workshops at Bangkok and Koh Samet') ||
                sale.includes.includes('All workshops at Koh Samet only')
                  ? 1
                  : 0,
              Cruise:
                sale.includes.includes('Exclusive Cruise Party') || sale.includes.includes('Cruise Party in Bangkok')
                  ? 1
                  : 0,
              'Audi & Laura MC':
                sale.includes.includes('2H Audi & Laura Masterclass') ||
                sale.includes.includes('2H Masterclass by Audi & Laura') ||
                sale.pass == 'vip-gold'
                  ? calculateMasterclass(sale, 'audi-laura-masterclass')
                  : 0,
              'Audi & Laura MC Confirm':
                sale.includes.includes('2H Audi & Laura Masterclass') ||
                sale.includes.includes('2H Masterclass by Audi & Laura') ||
                sale.pass == 'vip-gold'
                  ? 1
                  : 0,
              'TPeak MC':
                sale.includes.includes("2H T'Peak Masterclass") ||
                sale.includes.includes("2H Masterclass by T'Peak") ||
                sale.pass == 'vip-gold'
                  ? calculateMasterclass(sale, 'tpeak-masterclass')
                  : 0,
              'TPeak MC Confirm':
                sale.includes.includes("2H T'Peak Masterclass") ||
                sale.includes.includes("2H Masterclass by T'Peak") ||
                sale.pass == 'vip-gold'
                  ? 1
                  : 0,
              'Asia MC':
                sale.includes.includes('2H Asia Masterclass') ||
                sale.includes.includes('2H Masterclass by Asia') ||
                sale.pass == 'vip-gold'
                  ? calculateMasterclass(sale, 'asia-masterclass')
                  : 0,
              'Asia MC Confirm':
                sale.includes.includes("2H T'Peak Masterclass") ||
                sale.includes.includes("2H Masterclass by T'Peak") ||
                sale.pass == 'vip-gold'
                  ? 1
                  : 0,
              'Afro Bootcamp': sale.includes.includes('1H30 Afro Essense Bootcamp by AfroGiants') ? 1 : 0,
              'Airport Pickup':
                sale.includes.includes('Airport Pick Up') || sale.includes.includes('Airport Pick up') ? 1 : 0,
              'Bangkok Hotel': sale.includes.some((inc) =>
                ['3 Nights Stay at I-Residence Silom', '3 Nights Stay at Bangkok hotel', '4 Nights Stay at Bangkok hotel', '3 Nights Stay at Heritage Bangkok Hotel (breakfast included)'].some((a) => inc.includes(a))
              )
                ? 1
                : 0,
              'Shared Room Samet': sale.includes.some((inc) =>
                ['3 Nights in a shared room', '3 Nights Stay at Koh Samet hotel', '3 Nights Stay in shared room at Koh Samet hotel', '3 Nights in a shared room at Hotel Sangthianbeach Resort'].some((a) => inc.includes(a))
              )
                ? 1
                : 0,
              Massage:
                sale.includes.filter((option) => option == '1H Foot Massage at Lek Massage').length ||
                sale.includes.filter((option) => option == '2H Foot Massage at Lek Massage').length * 2 ||
                sale.includes.filter((option) => option == '1H Foot Massage at Lek Massage per person').length ||
                sale.includes.filter((option) => option == '2H Foot Massage at Lek Massage per person').length * 2,
              'Promo Code': sale.promoCode,
              'Check in': sale.checkedIn ? 1 : 0,
              Amount: String(sale.total.amount / 100),
              Currency: sale.total.currency,
              includes: sale.includes.join(';'),
            })
            if (sale.customerType == 'couple') {
              return [
                makeRow({ ...sale, customerType: 'leader' }),
                makeRow({ ...sale, total: { ...sale.total, amount: 0 }, customerType: 'follower' }),
              ]
            }
            return [makeRow(sale)]
          })
          .concat([
            {
              id: '',
              Date: '',
              Email: '',
              Name: '',
              Pass: '',
              'Dancer type': '',
              Payment: '',
              'Koh Samet': 0,
              Cruise: 0,
              'Audi & Laura MC': 0,
              'Audi & Laura MC Confirm': 0,
              'TPeak MC': 0,
              'TPeak MC Confirm': 0,
              'Asia MC': 0,
              'Asia MC Confirm': 0,
              'Afro Bootcamp': 0,
              'Airport Pickup': 0,
              'Bangkok Hotel': 0,
              'Shared Room Samet': 0,
              Massage: 0,
              'Promo Code': '',
              "Check in": 0,
              Amount: (salesReport.totalInTHB / 100).toLocaleString('en-us', { minimumFractionDigits: 2 }),
              Currency: 'THB',
              includes: '',
            },
          ])
      )
    )
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const calculateMasterclass = (sale: Sales, masterclassId: string) => {
  if (sale.pass == 'vip-gold') {
    return 1700
  }
  const item = sale.items.find(({ id }) => [masterclassId, 'all-masterclass'].includes(id))
  if (!item) {
    return -1
  }
  const calculateDiscount = (sale: Sales, amount: number) => {
    if (sale.includes.includes('Discount 5% off')) {
      return amount * 0.95
    }
    if (sale.includes.includes('Discount 10% off')) {
      return amount * 0.90
    }
    return amount
  }
  const amount = item.id == 'all-masterclass' ? item.total.amount / 3 : item.total.amount
  return calculateAmountInTHB(calculateDiscount(sale, amount / 100), item.total.currency)
}

export const calculateAmountInTHB = (amount: number, currency: Currency) => {
  switch (currency) {
    case 'EUR':
      return Number((amount / 0.025).toFixed(0))
    case 'USD':
      return Number((amount / 0.028).toFixed(0))
    case 'THB':
      return amount
    default:
      throw new Error('Can not calculate amount in THB because currency is unknown.')
  }
}

export const preGuestRegistration = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body ?? '{}')
  if (!body.email || !body.fullname) {
    return invalidRequestErrorResponse('Email and fullname is required.')
  }
  try {
    const emailAdapter = new SESEmailService({ email: 'no-reply@afrokizbkk.com', name: 'AfroKiz BKK' })
    const guestRegistration = new GuestRegistration(repository, emailAdapter)
    await guestRegistration.preRegister({ email: body.email, fullname: body.fullname })
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const preRegistraterForSametGetaway = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body ?? '{}')
  if (!body.email || !body.fullname) {
    return invalidRequestErrorResponse('Email and fullname is required.')
  }
  try {
    const emailAdapter = new SESEmailService({ email: 'no-reply@afrokizbkk.com', name: 'AfroKiz BKK' })
    const sametRegistration = new SametRegistration(repository, emailAdapter)
    await sametRegistration.preRegister({ email: body.email, fullname: body.fullname })
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const getGuest = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const guestId = event.pathParameters?.email
  if (!guestId) {
    return notFoundErrorResponse('Guest id is required.')
  }
  try {
    const guestCheckIn = new GuestCheckIn(repository)
    const guest = await guestCheckIn.getGuest(guestId)
    return successResponse({
      email: guest.email,
      fullname: guest.fullname,
      checked_in: guest.checkedIn,
    })
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const checkInGuest = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body ?? '{}')
  if (!body.email) {
    return notFoundErrorResponse('Guest email is required.')
  }
  try {
    const guestCheckIn = new GuestCheckIn(repository)
    await guestCheckIn.checkIn(body.email)
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

export const remakeEmailTemplates = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const emailAdapter = new SESEmailService({ email: 'no-reply@afrokizbkk.com', name: 'AfroKiz BKK' })
    await emailAdapter.cleanUp(['PreGuestRegistrationEmail'])
    await emailAdapter.createTemplate(preGuestRegistrationEmailTemplate())
    return successfullyCreatedResponse()
  } catch (error) {
    console.error(error)
    return internalServerErrorResponse(error)
  }
}

const convertToCSV = (json: any) => {
  const items = json
  const replacer = (key: any, value: any) => (!value ? '' : value)
  const header = Object.keys(items[0])
  return [
    header.join(','),
    ...items.map((row: any) => header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(',')),
  ].join('\r\n')
}

const successfullyCreatedResponse = () => ({
  statusCode: 201,
  headers,
  body: '',
})

const successCSVResponse = (body: any) => ({
  statusCode: 200,
  headers: { ...headers, 'Content-Type': 'text/csv', 'Content-disposition': 'attachment; filename=sales_report.csv' },
  body: body,
})

const successResponse = (body: any) => ({
  statusCode: 200,
  headers,
  body: JSON.stringify(body),
})

const invalidRequestErrorResponse = (message: string) => ({
  statusCode: 400,
  headers,
  body: JSON.stringify({ message }),
})

const notFoundErrorResponse = (message: string) => ({
  statusCode: 404,
  headers,
  body: JSON.stringify({ message }),
})

const internalServerErrorResponse = (error: any) => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ message: error?.message ?? `Unknown error: ${error}` }),
})

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
