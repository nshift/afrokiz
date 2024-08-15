import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { Sales } from '../../entities/sales'
import { SalesReporting } from '../../sales.reporting'
import { DynamoDbAdapter } from '../dynamodb/dynamodb'

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
              'Said Oksana MC':
                sale.includes.includes('2H Masterclass by Said & Oksana') ||
                sale.includes.includes('2H Said & Oksana Masterclass and 2H Heneco Masterclass')
                  ? 1
                  : 0,
              'Heneco MC':
                sale.includes.includes('2H Masterclass by Heneco') ||
                sale.includes.includes('2H Said & Oksana Masterclass and 2H Heneco Masterclass')
                  ? 1
                  : 0,
              Cruise:
                sale.includes.includes('Exclusive Dinner Cruise Party') ||
                sale.includes.includes('Exclusive Dinner Cruise Party (7th September 6:30PM-9:30PM)')
                  ? 1
                  : 0,
              Ginga: sale.includes.includes('2H Ginga Styling bootcamp (video recorded)') ? 1 : 0,
              Massage: sale.includes.filter((option) => option == '1H Foot Massage at Lek Massage').length,
              'Promo Code': sale.promoCode,
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
              'Said Oksana MC': 0,
              'Heneco MC': 0,
              Cruise: 0,
              Ginga: 0,
              Massage: 0,
              'Promo Code': '',
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

const convertToCSV = (json: any) => {
  const items = json
  const replacer = (key: any, value: any) => (!value ? '' : value)
  const header = Object.keys(items[0])
  return [
    header.join(','),
    ...items.map((row: any) => header.map((fieldName) => JSON.stringify(row[fieldName], replacer)).join(',')),
  ].join('\r\n')
}

const successCSVResponse = (body: any) => ({
  statusCode: 200,
  headers: { ...headers, 'Content-Type': 'text/csv', 'Content-disposition': 'attachment; filename=sales_report.csv' },
  body: body,
})

const internalServerErrorResponse = (error: any) => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ message: error?.message ?? `Unknown error: ${error}` }),
})

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
