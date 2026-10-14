export type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  image: string
  badge?: string
}

export type CartItem = {
  product: Product
  quantity: number
}
