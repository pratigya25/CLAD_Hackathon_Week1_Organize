# Shelf Expiry Tracker — CLAD Summer Hackathon, Week 1: Organize

## What we built

An AR Lens for Spectacles that turns a physical store shelf into a live, organized
inventory dashboard. Eight tracked products across the shelves each carry a 3D
label showing their expiry status, stock level, or price — but instead of
cluttering the view with everything at once, the labels are organized behind a
filter menu with four categories:

- **Expiring Tomorrow** — items that need to move today
- **Expiring This Month** — items on a medium-term watch list
- **Low Stock** — items that need reordering
- **On Sale** — discounted items, priced for clearance

Tapping a filter reveals only the matching products' labels and a red marker
arrow pointing at the shelf. A built-in guided demo sequence (for anyone
previewing without live marker tracking) walks through all four filters
automatically, smoothly panning the whole store around the viewer to "look at"
each matching product in turn — without ever fighting the headset's own
head-tracking, so the camera itself never jitters.

## How it responds to "Organize"

The core problem this Lens solves is information overload: a shelf full of
products has too much expiry/stock/pricing data to show at once and still be
useful. This Lens organizes that data by *urgency and category* rather than by
physical layout, letting a viewer instantly answer "what needs attention right
now?" instead of having to inspect every item individually.

## Who it's for

- **Store/warehouse staff** doing shelf audits — spot what's expiring, low, or
  needs a price cut in seconds instead of manually checking each item.
- **Shoppers** looking for deals or fresher stock — filter straight to
  discounted or soon-to-expire items while walking the aisle.

## How CLAD was used

The entire Lens — marker-based product tracking, the inventory data model, the
filter menu UI (built on SpectaclesUIKit's Toolbar), the 3D label rendering,
and the auto-play demo sequencer with its camera-free store-rotation animation
— was built through iterative, conversational AI-assisted development in
Lens Studio via the CLAD toolkit's Editor/Lens API tools (scene inspection,
TypeScript recompilation, runtime log verification, and live Preview testing
after every change). The full prompt-by-prompt history is included in the
submission as the CLAD prompt log.
