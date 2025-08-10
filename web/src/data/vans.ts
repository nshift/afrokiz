export type Shoes = {
    id: string
    name: string
    isSoldOut: boolean,
    price: { USD: number, EUR: number, THB: number },
    sizes: string[],
    colors: string[]
    pictures: { [key: string]: string[]}
}

export const afrokizShoes: { [key: string]: Shoes } = {
    vans: {
        id: 'afrokiz-vans',
        name: 'Vans Afrokiz Edition By Kobby',
        isSoldOut: false,
        price: { USD: 5500, EUR: 4800, THB: 178000 },
        sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],
        colors: ['Purple'],
        pictures: {
            Purple: ['/images/tshirt/vans.jpg', '/images/tshirt/all.jpg', '/images/tshirt/vans1.jpg']
        }
    }
}