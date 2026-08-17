# Demo Video Shot List — Shelf Expiry Tracker

Target length: 60-90 seconds. Record in Lens Studio Preview (or on Spectacles
if available) with the built-in autoPlay demo running, which does the camera
work for you.

## Suggested flow

1. **Cold open (5s)** — Wide shot of the store shelves, nothing highlighted
   yet. One line of narration/text overlay: "Shelf Expiry Tracker — an AR Lens
   that organizes a store shelf by what needs attention."

2. **Menu opens (5s)** — Hamburger menu opens, four filter buttons visible:
   Expiring Tomorrow / Expiring This Month / Low Stock / On Sale. Call out
   that this is the "Organize" theme response: turning shelf clutter into an
   organized, filterable view.

3. **Expiring Tomorrow (10-15s)** — Button click, camera pans to the matching
   product, label + red marker appear. Narrate what's shown (product name,
   "Expires tomorrow!" text).

4. **Expiring This Month (10-15s)** — Same beat, multiple products revealed
   in sequence as the world pans between them. This is a good moment to
   mention the label text and marker are driven by real inventory data
   (`Assets/Data/inventory.json`), not hardcoded per product.

5. **Low Stock (10-15s)** — Shows stock counts. Good moment to mention the
   camera-vs-store-rotation trick: the headset's own camera transform is
   never touched, so head tracking and the scripted pan never fight each
   other.

6. **On Sale (10-15s)** — Shows discounted price vs. original price.

7. **CLAD explanation (8-10s)** — Cut to a screen-recording (or held screenshot)
   of the actual Claude Code session, scrolled to a real prompt/fix from this
   project (e.g. the menu-button-overflow fix, or the animation revert),
   ideally paired with a quick cut back to Preview showing the before/after.
   Line: "Every part of ShelfSense -- the tracking, the menu, the animation --
   was built through conversational prompts with CLAD in Lens Studio,
   iterating live in Preview until it worked."

8. **Wrap (5-10s)** — Menu closes, sequence ends, brief text overlay: "Built
   end-to-end with CLAD in Lens Studio — full prompt log included."

## Things to make sure are visible on camera

- The menu opening/closing and button press pulse.
- At least one full pan (camera/world movement) arriving at a product, timed
  with the label appearing (this is the "in sync" behavior worth showing off).
- A close-up on at least one label's text so judges can read the expiry/stock/
  price info clearly.

## Optional voiceover / caption talking points

- "Every label and filter is driven by real inventory data, not hardcoded."
- "The demo sequencer rotates the whole store around a fixed camera pivot
  instead of moving the camera — so it never fights head tracking."
- "Built conversationally with CLAD: [N] iterations refining the animation,
  UI, and label logic based on live Preview testing."
