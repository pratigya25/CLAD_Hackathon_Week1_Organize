export type ExpiryStatus = "green" | "yellow" | "red"
export type ProductCategory = "day" | "week" | "lowStock" | "sale"

export type ProductStatus = {
  productName: string
  expiryDate: string
  shelfLocation: string
  daysLeft: number
  status: ExpiryStatus
  stockCount: number
  isLowStock: boolean
  price: number
  salePrice: number
  category: ProductCategory
}

type ProductRecord = {
  markerId: string
  productName: string
  expiryDate: string
  shelfLocation: string
  stockCount: number
  price: number
  category: ProductCategory
}

const MS_PER_DAY = 1000 * 60 * 60 * 24
const LOW_STOCK_THRESHOLD = 5
const SALE_DISCOUNT = 0.2

@component
export class InventoryLookup extends BaseScriptComponent {
  @input
  @hint("JSON asset simulating the store inventory backend (Assets/Data/inventory.json).")
  private inventoryAsset: JsonAsset

  private byMarkerId: Record<string, ProductRecord> = {}

  onAwake(): void {
    const parsed = JSON.parse(this.inventoryAsset.getString()) as { products: ProductRecord[] }
    for (const product of parsed.products) {
      this.byMarkerId[product.markerId] = product
    }
  }

  public getStatus(markerId: string): ProductStatus | null {
    const record = this.byMarkerId[markerId]
    if (!record) {
      return null
    }

    const daysLeft = Math.ceil((new Date(record.expiryDate).getTime() - Date.now()) / MS_PER_DAY)

    let status: ExpiryStatus
    if (daysLeft < 3) {
      status = "red"
    } else if (daysLeft <= 7) {
      status = "yellow"
    } else {
      status = "green"
    }

    return {
      productName: record.productName,
      expiryDate: record.expiryDate,
      shelfLocation: record.shelfLocation,
      daysLeft,
      status,
      stockCount: record.stockCount,
      isLowStock: record.stockCount <= LOW_STOCK_THRESHOLD,
      price: record.price,
      salePrice: Math.round(record.price * (1 - SALE_DISCOUNT) * 100) / 100,
      category: record.category
    }
  }
}
