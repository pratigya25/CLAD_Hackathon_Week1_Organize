import {HandInputData} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData"
import {HandType} from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandType"

@component
export class HandMenuAnchor extends BaseScriptComponent {
  @input
  @widget(new ComboBoxWidget([new ComboBoxItem("Left", "left"), new ComboBoxItem("Right", "right")]))
  @hint("Which hand's wrist this menu follows.")
  private handType: string = "left"

  @input
  @hint("Local offset from the wrist, along the wrist's own axes (cm).")
  private offset: vec3 = new vec3(0, 4, 0)

  private handInputData: HandInputData

  onAwake(): void {
    this.handInputData = HandInputData.getInstance()
    this.sceneObject.enabled = false
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private onUpdate(): void {
    const hand = this.handInputData.getHand(this.handType as HandType)

    if (!hand.isTracked()) {
      this.sceneObject.enabled = false
      return
    }

    this.sceneObject.enabled = true

    const wrist = hand.wrist
    const worldRotation = wrist.rotation
    const worldOffset = worldRotation.multiplyVec3(this.offset)

    const transform = this.getTransform()
    transform.setWorldPosition(wrist.position.add(worldOffset))
    transform.setWorldRotation(worldRotation)
  }
}
