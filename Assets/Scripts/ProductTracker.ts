import {InventoryLookup, ProductCategory, ProductStatus} from "./InventoryLookup"
import {ExpiryFilterManager, FilterState} from "./ExpiryFilterManager"

const LABEL_COLOR = new vec4(1, 1, 1, 1)
const LABEL_SIZE = 130

@component
export class ProductTracker extends BaseScriptComponent {
  @input
  @hint("The InventoryLookup component that resolves marker IDs to expiry status.")
  private inventoryLookup: InventoryLookup

  @input
  @allowUndefined
  @hint("This marker's tracking component, used to bind found/lost events. Leave empty for a static shelf display that is always visible (e.g. Preview environment demos without live marker tracking).")
  private markerTracking: MarkerTrackingComponent

  @input
  @hint("Must match a markerId entry in Assets/Data/inventory.json.")
  private markerId: string

  @input
  @hint("Text3D that displays the product name and expiry status.")
  private labelText: Text3D

  @input
  @allowUndefined
  @hint("Optional: drives which products are highlighted based on the active expiry filter.")
  private filterManager: ExpiryFilterManager

  @input
  @hint("Scales the label text size. Tune per-instance for viewing distance (1 = default AR-marker distance).")
  private labelScale: number = 1

  @input
  @allowUndefined
  @hint("Optional: red marker/arrow pointing down at the shelf. Shown/hidden together with the label text.")
  private arrow: SceneObject

  private lastStatus: ProductStatus | null = null

  /** Stable marker id, e.g. "product_b". Used by DemoSequencer to correlate trackers with the demo script. */
  public get id(): string {
    return this.markerId
  }

  /** The category this product currently belongs to (day/month/lowStock/sale), or null if inventory hasn't loaded yet. */
  public get category(): ProductCategory | null {
    return this.lastStatus ? this.lastStatus.category : null
  }

  /** World position of this product's label, used by DemoSequencer to aim the camera. */
  public get worldPosition(): vec3 {
    return this.sceneObject.getTransform().getWorldPosition()
  }

  onAwake(): void {
    if (this.markerTracking) {
      this.markerTracking.onMarkerFound = () => this.updateLabel()
      this.markerTracking.onMarkerLost = () => {}
    } else {
      this.createEvent("OnStartEvent").bind(() => this.updateLabel())
    }

    if (this.filterManager) {
      this.filterManager.subscribe(() => this.applyLabel())
    }
  }

  private updateLabel(): void {
    this.lastStatus = this.inventoryLookup.getStatus(this.markerId)
    this.applyLabel()
  }

  private matchesFilter(status: ProductStatus, filter: FilterState): boolean {
    return filter.mode !== "none" && status.category === filter.mode
  }

  private infoLine(status: ProductStatus): string {
    switch (status.category) {
      case "day":
        return status.daysLeft < 0
          ? "Expired!"
          : status.daysLeft === 0
            ? "Expires today!"
            : `Expires in ${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"}!`
      case "week":
        return `Expires in ${status.daysLeft} days`
      case "lowStock":
        return `Only ${status.stockCount} left!`
      case "sale":
        return `On Sale: $${status.salePrice.toFixed(2)} (was $${status.price.toFixed(2)})`
      default:
        return ""
    }
  }

  /** Shows or hides this product's label + marker without changing its text. Used by DemoSequencer to reveal matches one at a time. */
  public setVisible(visible: boolean): void {
    this.labelText.enabled = visible
    if (this.arrow) {
      this.arrow.enabled = visible
    }
  }

  private applyLabel(): void {
    if (!this.lastStatus) {
      print(`ProductTracker: no inventory entry for markerId "${this.markerId}"`)
      this.labelText.text = "Unknown product"
      this.labelText.mainPass.baseColor = LABEL_COLOR
      this.setVisible(true)
      return
    }

    const status = this.lastStatus
    const filter = this.filterManager ? this.filterManager.getFilter() : null
    const matchesFilter = filter ? this.matchesFilter(status, filter) : false

    // Labels only appear while their matching filter button is active.
    this.setVisible(matchesFilter)
    if (!matchesFilter) {
      return
    }

    this.labelText.text = `${status.productName}\n${this.infoLine(status)}`
    this.labelText.size = LABEL_SIZE * this.labelScale
    this.labelText.mainPass.baseColor = LABEL_COLOR
  }
}
