export type FilterMode = "none" | "day" | "week" | "lowStock" | "sale"

export type FilterState = {
  mode: FilterMode
}

export type FilterChangedCallback = (state: FilterState) => void

export const NO_FILTER: FilterState = { mode: "none" }

@component
export class ExpiryFilterManager extends BaseScriptComponent {
  private state: FilterState = NO_FILTER
  private listeners: FilterChangedCallback[] = []

  onAwake(): void {
    // No filter selected yet -- product labels stay hidden until a menu
    // button is pressed.
    this.state = NO_FILTER
  }

  public getFilter(): FilterState {
    return this.state
  }

  public setFilter(state: FilterState): void {
    this.state = state
    for (const listener of this.listeners) {
      listener(state)
    }
  }

  public subscribe(callback: FilterChangedCallback): void {
    this.listeners.push(callback)
  }
}
