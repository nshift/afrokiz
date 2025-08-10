export type TShirt = {
    id: string
    name: string
    isSoldOut: boolean,
    price: { USD: number, EUR: number, THB: number },
    sizes: string[],
    colors: string[]
    pictures: { [key: string]: string[]}
}

export const afrokizTshirts: { [key: string]: TShirt } = {
    man: {
        id: 'afrokiz-tshirt-man',
        name: 'Afrokiz TShirt Kobby Edition',
        isSoldOut: false,
        price: { USD: 3000, EUR: 2500, THB: 97000 },
        sizes: ['S', 'M', 'L'],
        colors: ['Purple', 'Black'],
        pictures: {
            Black: ['/images/tshirt/black1.jpg', '/images/tshirt/black2.jpg', '/images/tshirt/black3.jpg'],
            Purple: ['/images/tshirt/purple3.jpg', '/images/tshirt/purple1.jpg', '/images/tshirt/purple2.jpg']
        }
    },
    woman: {
        id: 'afrokiz-crop-top-woman',
        name: 'Afrokiz Crop Top Kobby Edition',
        isSoldOut: false,
        price: { USD: 2500, EUR: 2100, THB: 80000 },
        sizes: ['S', 'M', 'L'],
        colors: ['Black', 'White'],
        pictures: {
            Black: ['/images/tshirt/woman-black1.jpg', '/images/tshirt/woman-black2.jpg'],
            White: ['/images/tshirt/woman-white3.jpg', '/images/tshirt/woman-white2.jpg', '/images/tshirt/woman-white1.jpg']
        }
    },
}