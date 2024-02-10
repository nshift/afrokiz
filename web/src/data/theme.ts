import { valentinePromotion } from './promotion'

export const theme = () => {
  const themes: { [key: string]: boolean } = {
    valentine: valentinePromotion.isActive,
    valentine2: valentinePromotion.isActive,
  }
  return Object.keys(themes).filter((key) => themes[key] == true)[0] ?? ''
}
