import {Toolbar} from "SpectaclesUIKit.lspkg/Scripts/Components/Toolbar/Toolbar"
import {ToolbarAlignment, ToolbarButtonConfig, ToolbarButtonType, ToolbarItemType} from "SpectaclesUIKit.lspkg/Scripts/Components/Toolbar/Types/ToolbarSchema"
import {ToolbarItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Toolbar/Items/ToolbarItem"
import {ExpiryFilterManager, FilterState} from "./ExpiryFilterManager"
import {FilterMenuToggle} from "./FilterMenuToggle"

export type FilterOption = {
  label: string
  state: FilterState
}

export const FILTER_OPTIONS: FilterOption[] = [
  {label: "Expiring Tomorrow", state: {mode: "day"}},
  {label: "Expiring This Month", state: {mode: "week"}},
  {label: "Low Stock", state: {mode: "lowStock"}},
  {label: "On Sale", state: {mode: "sale"}}
]

const MENU_BACKGROUND_CORNER_RADIUS = 2.5
const CLICK_PULSE_SECONDS = 0.25
const CLICK_PULSE_SCALE = 1.3

// The toolbar's own FILL-mode auto-sizing does not reliably give buttons the
// container's full width (verified: every item came back clamped to the same
// tiny (3, 1.19) regardless of label length). Sizing every button explicitly
// sidesteps that entirely. 11.6 x 4.2 comfortably exceeds the longest label's
// measured intrinsicSize (10.55 x 3.0, "Expiring This Month") with margin.
const BUTTON_SIZE = new vec2(11.6, 4.2)

@component
export class ExpiryFilterMenu extends BaseScriptComponent {
  @input
  @hint("Toolbar component that renders the filter buttons.")
  private toolbar: Toolbar

  @input
  @hint("Shared filter state that ProductTracker instances subscribe to.")
  private filterManager: ExpiryFilterManager

  @input
  @allowUndefined
  @hint("Optional: controls the hamburger show/hide behavior. When set, the menu auto-collapses after a selection.")
  private menuToggle: FilterMenuToggle

  private items: ToolbarItem[] = []

  private pulsing: boolean = false
  private pulseElapsed: number = 0
  private pulseItem: ToolbarItem | null = null
  private pulseBaseScale: vec3 | null = null

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.setup())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private setup(): void {
    this.toolbar.initialize()
    this.toolbar.backgroundCornerRadius = MENU_BACKGROUND_CORNER_RADIUS

    // Vertical toolbars stack bottom-up in creation order (confirmed in
    // SpectaclesUIKit's ToolbarLayoutManager: the primary axis starts from
    // padding.bottom). Creating in reverse makes FILTER_OPTIONS[0] the last
    // item created, which lands at the top -- so the on-screen reading order
    // and the demo's click order both run top-to-bottom.
    this.items = new Array(FILTER_OPTIONS.length)
    for (let i = FILTER_OPTIONS.length - 1; i >= 0; i--) {
      const option = FILTER_OPTIONS[i]
      const config: ToolbarButtonConfig = {
        type: ToolbarItemType.BUTTON,
        alignment: ToolbarAlignment.CENTER,
        buttonType: ToolbarButtonType.CAPSULE,
        text: option.label,
        size: BUTTON_SIZE,
        onTriggerUp: () => this.selectOption(option)
      }
      this.items[i] = this.toolbar.addItem(config)
    }
  }

  private onUpdate(): void {
    if (!this.pulsing) {
      return
    }
    this.pulseElapsed += getDeltaTime()
    if (this.pulseElapsed >= CLICK_PULSE_SECONDS) {
      this.pulsing = false
      this.restorePulse()
    }
  }

  /** Real user click path: applies the filter and schedules the menu to auto-collapse. */
  private selectOption(option: FilterOption): void {
    this.filterManager.setFilter(option.state)
    if (this.menuToggle) {
      this.menuToggle.scheduleAutoClose()
    }
  }

  /** Plays the button press pulse for the option at `index`, without touching the filter or menu state. Used by DemoSequencer to animate a scripted click. */
  public pulseButton(index: number): void {
    const item = this.items[index]
    if (item) {
      this.pulseClickEffect(item)
    }
  }

  private pulseClickEffect(item: ToolbarItem): void {
    const transform = item.transform
    const baseScale = transform.getLocalScale()
    transform.setLocalScale(baseScale.uniformScale(CLICK_PULSE_SCALE))

    this.pulseItem = item
    this.pulseBaseScale = baseScale
    this.pulseElapsed = 0
    this.pulsing = true
  }

  private restorePulse(): void {
    if (this.pulseItem && this.pulseBaseScale) {
      this.pulseItem.transform.setLocalScale(this.pulseBaseScale)
    }
  }
}
