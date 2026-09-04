# Office shell — not a cell

Companion to `docs/office.md` (The room) and `docs/office-ux.md` (Feel of the situation). Apply in `src/world.ts` `buildRoom()` / `lights()` and `src/theme.ts` palette. Not a new situation. Not a hallway.

Locked: **SUNDAY AT THE OFFICE** / `The printer has opinions.` Portrait dollhouse. Object cap ~10. Frozen PC is paint. One blink: the printer. Copier sleeps. Cup is the loud fuse.

---

## Verdict

It reads as a **jail cell** because the shell is a sealed olive box with **bars**, **no outside**, and **not enough leftover light**.

The ten left-wall slats (`BoxGeometry(0.02, 0.07, 0.9)`, stacked, no glass, no opening) are prison bars. Horizontal, dark, wall-to-wall on that face. There is no pane, no daylight, no frame. A stranger does not think “blinds.” They think “don’t escape.”

The rest of the box agrees with the bars:

- **No window.** No door. A closed cube with one desk in it is a cell, even if the desk has a printer.
- **Walls are one dead paint.** `#b7bba8` / `#9aa087`, no baseboard, no cheap variation, no office tell. Cells and warehouses are featureless. Cube farms are petty: a dado, a scuff, a thermostat.
- **Too dark for Sunday leftover.** Hemi 0.62, ambient 0.28, fixture emissive 0.35, floor `#6a635c`. That is interrogation-adjacent, not “too bright for how quiet it is.” The hard diagonal directional (0.95, sharp shadow) is a single skylight in a bunker, not a tired fluorescent grid.
- **After the camera pulled back** to fill a landscape pane, the desk is a small cluster in a large empty olive volume. That is a warehouse bay / holding cell, not a Sunday cube. Empty olive is supposed to be *gaps between silhouettes* (`docs/office-ux.md` COV-03), not full-width wall slabs.

The authored still is the opposite: **Sunday. Empty. Fluorescent leftover. Too bright for how quiet it is.** A closed office you were not supposed to enter — not a locked room you cannot leave. The printer is the only thing still picking a fight. The shell has to look like *work leftover*, or the joke is “prison printer,” which is a different game.

---

## Set dressing (in frame)

Minimum. Architecture and paint. Not smashables. Not a texture pack. Hits on these are empty desk (`That helped.`) or sticky-prefer the real toys. Frozen PC stays paint, not an 11th toy.

**Delete the ten slats.** Do not keep them as “blinds.” They failed that read. If blinds exist after this, they live *inside a window frame*, thin, pale, with glass and daylight visible. Vertical stack pulled aside is safer than a wall of horizontals.

| Thing | Where in the cover | Job | Fail looks like |
| --- | --- | --- | --- |
| **Window** (one) | **Left wall, upper / mid of the working band**, behind or above the plant. Framed opening: aluminum or cheap white PVC, glass, pale overcast daylight. A short sliver of pane is enough on viewport **C**; the wide pane may show more of the same window, not a second one. | Proof of outside. Sunday light, not a view. Shape = rectangle of sky-wash in a frame. Color is not the only signal: frame + sill + glass. Daylight is a **cool wall wash** on the plant and left wall. | Prison bars; no glass; black void; city / traffic / parking lot; golden-hour sun shaft; a glowing rectangle brighter than the printer LED; a window the thumb wants to smash; a second window on the right competing with the copier. |
| **Door** (one, **closed**) | **Back wall**, toward the copier side or just right of the desk stack — a slab in a frame, handle, optional dark vision panel. On **C**, the *silhouette* must read (frame + handle), even if the full slab is cropped. On a wide pane, more slab is fine. Latch side visible. | Proof you could have left. You didn’t. It is scenery, not an exit. Corridor, if hinted at all, is **dark** (Sunday; nobody’s out there). | Open door; hallway; second room; a black rectangle with no hardware; a walkable gap; glowing EXIT as an alarm; a tap target / “leave” affordance; a door in the thumb-rest 18%. |
| **Baseboard** | Floor–wall joints that are in frame: left wall, back wall, a hint on the right if that wall shows. Cheap, ~chair-rail height in screen space (a strip, not a second room). Slightly darker or slightly creamier than the wall. | “This paint meets a floor on purpose.” Cells skip this. Offices don’t. | Missing; a fat bunker ledge; stone; a smashable kickplate. |
| **Cheap paint** | All three walls + ceiling. Lift the olive so it reads as tired **office** paint (cooler, lighter leftover), not dungeon plaster. Ceiling stays the brightest plane (drop-ceiling white/grey). One quiet value break is enough: wall vs baseboard, or a faintly dirtier lower third. Optional: one scuff or roller miss behind the plant — paint, not a decal pack. | The box is a cube farm, not a holding cell. Variation is petty, not scenic. | Flat single swatch; brick; dungeon stone; wallpaper mural; a noisy texture that fights the cup silhouette. |
| **One boring office tell** | Pick **one**, not a catalog. Preferred: **unlit EXIT plate** above the door (letters, **not emissive**) **or** a **thermostat / light switch** on the latch side of the door. Alternate if those hide on **C**: a 2×4 **drop-ceiling tile grid** around the existing fluorescent fixture. | Instant “I have been here on a Sunday.” Architecture, not a toy. | Glowing EXIT (second alarm); a smashable poster; a second desk; a water cooler; motivational canvas; fire-hose cabinet that wants a hit. |
| **Tired carpet** | Floor plane in the working band, under desk / chair / copier sliver. Lift off dungeon brown (`#6a635c`). Grey-beige, a bit dirty, still a plane. Soft contact shadow under the desk is allowed; a hard bar of darkness is not. | Offices have carpet. Cells have slabs. | Concrete bunker; glossy stone; a second rug toy; a void of black under the cluster. |
| **Fluorescent fixture** (already in the room) | Ceiling strip, already authored. Keep it. Make it *read* as leftover overhead: a 2×4 coffin in a tile, faintly present, not a hero lamp. | The light source of a dead office. | Disco bar; warm pendant stealing the hanging lamp’s job; a fixture so dim the room still feels like night. |
| **Frozen PC** (already paint) | Back of desk, dim, stuck. Do not enlarge to fill empty wall. | Friday leftover. Not a fuse. | An 11th toy; a bright screen competing with the blink; a second monitor wall. |

**Cover order must survive the dressing.** Two-second point is still **printer** (tied with cup as “that will go in”). Window and door are *named in five seconds*, not first. Plant stays a quarter of the cup’s “please touch.” Door and window must not match the cup’s visual volume.

**Hit rules:** door, window, baseboard, EXIT, thermostat, ceiling, walls = not in the object cap. Raycast as wall / miss. Sticky targeting prefers cup, printer, chair, plant, bag, phone. Do not add collision toys.

---

## Light

The still should feel like **leftover fluorescent on a Sunday**: too even, a bit cold, a bit too bright for a building this empty. Nobody turned the lights off. Nobody turned the sun into a movie. HVAC hum. One ugly blink.

| Quality | Direction | Why |
| --- | --- | --- |
| Overall | **Brighter** than the current still. The room is on. It should not look like night or a basement. | Authored line: too bright for how quiet it is. |
| Color | **Colder.** Green-grey leftover, not tungsten, not sunset. Hemisphere / ambient toward fluorescent, not cream-gold. | Golden hour is romance. This is unpaid overtime. |
| Shadows | **Softer.** Kill the hard diagonal “one bulb in a cell” slash. Contact shadows under desk, chair, copier are fine. A single sharp shaft is not. | Even overhead is the joke. Spotlight is a dungeon. |
| Fixture | **More present** as fill. It should actually light the desk cluster. Emissive enough to read as a lit 2×4, not a dead grey bar. No flicker. Flicker is a second blink. | One alarm in the room. |
| Window daylight | **Cool fill, not a key.** A pale overcast wash on the left wall and plant. The pane can be slightly brighter than the wall. It must **not** out-punch the printer LED in saturation or pulse. No sun disc. No god rays. | Outside exists. The error LED is still the problem. |
| Printer LED | **Only alarm.** Slow, ugly, amber/error. Contrast comes from *saturation + blink against even light*, not from sitting in a dark room. After the lift, the blink must still be the first *moving* light. | If the window wins the eye, the fuse legend dies. |
| Copier | Stays **dark**. No ready LED. No scan bar in calm. | Sleeping punchline. |
| Hanging lamp | Shade and cord. It may hang in leftover light. It must not become a warm key or a strobe. | Pendulum, not a second sun. |
| Cup | Keeps contrast via **silhouette + steam + wet ring**, not a beauty light. | Loud fuse, not a product shot. |

Reduce Motion: no animated blinds, no fluorescent flicker, no caustic crawl on the floor. The pane is still a rectangle of daylight. The punchline still sells.

Accessibility: window = frame + glass + wash (shape). Door = slab + frame + handle (hardware). EXIT letters if used. Do not rely on a hue shift alone to say “glass” or “door.”

---

## Testable

Calm, no-drag PNG. Chrome hidden except title if it is already receded. Author viewport **C** `390×844`. Also shoot the **current wide desktop pane** (canvas fills the browser; do not add zoom to pass). Crop notes: on **C**, measure the playfield; on desktop, the full pane is the exhibit — that is where the warehouse/cell read currently lives.

A stranger (no briefing) gets two seconds on **C**, five on desktop. They should say **office** / **Sunday** / **printer**. They must not say **jail**, **cell**, **dungeon**, **prison**, or **warehouse**.

| ID | Viewport | Fail a stranger can call |
| --- | --- | --- |
| SHELL-01 | C and desktop | Ten horizontal slats, or any bar-like stack with **no glass and no frame**, on the left wall. |
| SHELL-02 | C | No window: no framed opening, no glass, no daylight rectangle. A darker patch of wall is not a window. |
| SHELL-03 | C | No closed door: no slab + frame + handle. A black gap, an open door, or a hallway counts as fail. |
| SHELL-04 | C | First point is the window or the door, not the printer (or cup-as-spill). |
| SHELL-05 | C | Printer blink is missing, unreadable, or **not** the only pulsing / alarm light. Window pane pulses, EXIT glows, copier ready-light, lamp strobes. |
| SHELL-06 | C | Window daylight **drowns** the error LED: the pane is the brightest, hottest thing in the working band, or the blink disappears into glare. |
| SHELL-07 | C | Walls still read as one flat swatch: no baseboard on a visible floor–wall joint, no cheap paint lift / variation. |
| SHELL-08 | C | Floor still reads as dungeon slab / void (too dark, too brown, too empty under the cluster). |
| SHELL-09 | C | Room still feels **night**: overall dimmer than leftover fluorescent; hard single-source slash across the desk. |
| SHELL-10 | C | Door or window sits in the top 12% or bottom 18% as the *only* read of that object (cropped into unreadability), **or** the door is in the thumb rest as a fake button. |
| SHELL-11 | Desktop wide pane | Desk cluster is a tiny island in a **large empty olive box**. Extra width shows blank sealed walls with no window/door occupying them. Warehouse / cell / void. |
| SHELL-12 | Desktop wide pane | Extra width invents a hallway, second desk, second room, or a walkable gap. |
| SHELL-13 | Either | Romantic golden hour, orange sun shaft, dungeon stone, brick cell, iron bars, dripping pipes. |
| SHELL-14 | Either | New smashable (poster you can break, door you can open, window you can smash, 11th toy). Frozen PC became a toy. |
| SHELL-15 | Either | Camera zoomed or FOV punched in to **hide** the box instead of dressing it. Occupancy cheat. |

**Pass line (C):** “Empty office. Printer’s pissed. There’s a window. Door’s closed.”

**Pass line (desktop):** same office, same cluster, walls that still say cube farm — not a diorama lost in a hangar.

COV-01–COV-11 in `docs/office-ux.md` still apply. This spec does not relax occupancy. Do not scale the cup to hide empty wall. Do not fill landscape by adding set dressing *in front of* the cup.

---

## Out

- Walkable hall, open door, camera you can drive, second room, kitchenette, another cubicle.
- Zoom, pinch, orbit, a closer FOV “to hide the cell.”
- 11th toy. Smashable door, smashable window, smashable poster, smashable EXIT, a plant *and* a water cooler.
- Window full of city / traffic / parking lot (`docs/office.md`).
- Romantic golden hour, god rays, sunset key, beauty rim on the cup.
- Dungeon stone, iron bars, dripping pipes, night-mode office, interrogation spotlight.
- Keeping the ten slats and calling them blinds.
- A second blink (flickering fluorescent, glowing EXIT, copier ready, window as alarm).
- Texture-pack walls that fight silhouettes.
- Pillarbox as the *only* fix for the desktop void — dress the room; layout of the 9:16 pane is a different ticket.
- Reopening the situation (new copy, new fuse, hallway to “find” the copier).
