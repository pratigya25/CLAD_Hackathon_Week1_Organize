import {Toolbar} from "SpectaclesUIKit.lspkg/Scripts/Components/Toolbar/Toolbar"
import {
  ToolbarAlignment,
  ToolbarButtonConfig,
  ToolbarButtonType,
  ToolbarItemType
} from "SpectaclesUIKit.lspkg/Scripts/Components/Toolbar/Types/ToolbarSchema"
import {ToolbarItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Toolbar/Items/ToolbarItem"

const FADE_DURATION_SECONDS = 0.15
const CLICK_PULSE_SECONDS = 0.25
const CLICK_PULSE_SCALE = 1.3

@component
export class FilterMenuToggle extends BaseScriptComponent {
  @input
  @hint("Small always-visible toolbar holding the hamburger button.")
  private hamburgerToolbar: Toolbar

  @input
  @hint("The filter toolbar that hides behind the hamburger button until toggled open.")
  private filterToolbar: Toolbar

  @input
  @allowUndefined
  @hint("Hamburger icon texture (Material Symbols 'menu'). Falls back to text if left empty.")
  private hamburgerIcon: Texture

  @input
  @hint("Seconds to wait after a filter selection before the menu auto-collapses so it stops blocking the view.")
  private autoCloseDelaySeconds: number = 1.6

  private isOpen: boolean = false

  // Driven from UpdateEvent (ticks every frame, confirmed reliable) rather
  // than DelayedCallbackEvent -- rescheduling a DelayedCallbackEvent, even
  // when bound exactly once and only ever reset() afterward, reliably fails
  // to fire again in this environment.
  private fading: boolean = false
  private fadeElapsed: number = 0
  private fadeFrom: number = 0
  private fadeTo: number = 0
  private autoCloseArmed: boolean = false
  private autoCloseElapsed: number = 0

  private hamburgerItem: ToolbarItem | null = null
  private pulsing: boolean = false
  private pulseElapsed: number = 0
  private pulseBaseScale: vec3 | null = null

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.setup())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private setup(): void {
    this.hamburgerToolbar.initialize()
    this.hamburgerToolbar.backgroundAlpha = 0
    const config: ToolbarButtonConfig = {
      type: ToolbarItemType.BUTTON,
      alignment: ToolbarAlignment.CENTER,
      buttonType: ToolbarButtonType.CAPSULE,
      icon: this.hamburgerIcon,
      text: this.hamburgerIcon ? undefined : "MENU",
      onTriggerUp: () => this.toggle()
    }
    this.hamburgerItem = this.hamburgerToolbar.addItem(config)

    this.filterToolbar.initialize()
    this.isOpen = false
    this.filterToolbar.sceneObject.enabled = false
    this.filterToolbar.alpha = 0
  }

  private onUpdate(): void {
    const dt = getDeltaTime()

    if (this.fading) {
      this.fadeElapsed += dt
      const t = Math.min(this.fadeElapsed / FADE_DURATION_SECONDS, 1)
      this.filterToolbar.alpha = this.fadeFrom + (this.fadeTo - this.fadeFrom) * t
      if (t >= 1) {
        this.fading = false
        if (this.fadeTo === 0) {
          this.filterToolbar.sceneObject.enabled = false
        }
      }
    }

    if (this.autoCloseArmed) {
      this.autoCloseElapsed += dt
      if (this.autoCloseElapsed >= this.autoCloseDelaySeconds) {
        this.autoCloseArmed = false
        this.close()
      }
    }

    if (this.pulsing) {
      this.pulseElapsed += dt
      if (this.pulseElapsed >= CLICK_PULSE_SECONDS) {
        this.pulsing = false
        if (this.hamburgerItem && this.pulseBaseScale) {
          this.hamburgerItem.transform.setLocalScale(this.pulseBaseScale)
        }
      }
    }
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  public open(): void {
    if (this.isOpen) {
      return
    }
    this.isOpen = true
    this.filterToolbar.sceneObject.enabled = true
    this.startFade(0, 1)
  }

  public close(): void {
    if (!this.isOpen) {
      return
    }
    this.isOpen = false
    this.startFade(1, 0)
  }

  /** Call after a filter selection so the menu tucks itself away and stops covering the shelves. */
  public scheduleAutoClose(): void {
    this.autoCloseElapsed = 0
    this.autoCloseArmed = true
  }

  /** Plays a button-press pulse on the hamburger icon, e.g. right before reopening it in the demo sequence. */
  public pulseHamburger(): void {
    if (!this.hamburgerItem) {
      return
    }
    const baseScale = this.hamburgerItem.transform.getLocalScale()
    this.hamburgerItem.transform.setLocalScale(baseScale.uniformScale(CLICK_PULSE_SCALE))
    this.pulseBaseScale = baseScale
    this.pulseElapsed = 0
    this.pulsing = true
  }

  private startFade(from: number, to: number): void {
    this.fadeFrom = from
    this.fadeTo = to
    this.fadeElapsed = 0
    this.fading = true
  }
}
