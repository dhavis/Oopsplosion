# Office — Sunday at the office

Vertical slice situation bible. Constraint for this slice: **Pile on**. On-screen copy: `Poke it. Then pile on.` Title copy: `SUNDAY AT THE OFFICE` / `The printer has opinions.`

This is a situation, not a campaign. UX owns composition, feel, and screen flow (`docs/ux-screen-flow.md`). This doc owns story, room, objects, fuses, and why a stranger pokes something.

**Assumption:** we author a small set of triggers on cheap physics. If an object is listed here, it must do the job named. Decorative clutter that does not fuse, vent, or punchline is how this becomes a warehouse.

---

## Story

Nobody was supposed to be here. Friday's deck did not print Friday. Monday will not move. IT is a voicemail that begins with "if this is an emergency." The person who jammed the tray left it for "whoever comes in next." That is you. It is Sunday.

The coffee went on the lip of the printer because the desk is already a crime scene of Friday: one sheet hanging out of the slot like a tongue, a phone that does not know the building is empty, a chair that was never pushed in. The copier in the corner was not invited. It is larger, calmer, and asleep.

The printer has opinions. They are all error codes. It has been blinking since you sat down. It will still be blinking if you do nothing. That is the insult.

---

## The situation

When the scene loads, the office is still. Ordered. Already wrong.

A portrait dollhouse: one desk, one hanging lamp, one sleeping copier. No one in frame. HVAC is the only thing moving that should be.

**Readable in two seconds (no quest log, no VO):**

- The **printer** sits on the desk with a stubborn error LED and a sheet hanging out of the jam. That is the named annoyance. A stranger can point at it.
- The **coffee cup** sits on the tray lip (or the last inch of desk that feeds the tray), steam, wet ring. A spill has a victim.
- The **phone** is face-down, buzzing a millimeter at a time. Someone, or a calendar, does not know it is Sunday.
- The **copier** is dark. LCD off. Lid closed. Not the two-second read. It is waiting.

Also in the still frame, quieter: a small desk fan aimed across the paper path, a hanging lamp over the desk, a rolling chair a half-turn off true with an overnight bag dumped on it, a plant in the back corner. Optional set dressing, not a fuse: a monitor in the background, frozen on `NOT RESPONDING` or a spinning wheel. If the PC is readable, good. If it wants to be an 11th toy, cut it back to paint.

Sound bed is the irritation, low: printer stutter, phone buzz, fan hum. Nothing is broken yet. The round has not started. The printer is already the enemy.

**Constraint in this slice:** extra Finger contacts are legal. First touch is still a fuse choice, not a smash checklist.

---

## Why they want to start the chain

The trigger is not a tutorial and not a mission. It is an irritation a stranger can name in two seconds: **a jammed printer, on a Sunday, with coffee on the lip.**

Poking something should feel like their idea. The scene does the asking. Chrome does not.

### Why they want the spiral ("not my fault")

Sunday is already a mistake. The printer is already blinking. Lighting a fuse is how you make Sunday *worse* without writing your name on it.

The coffee is the dare: it is one nudge from the intake. If it goes in, that is an accident. Accidents are the joke. The copier in the corner is the punchline they have not met yet — the quiet machine that will take the blame in bulk.

They are not here to "destroy the office." They are here to start something they can deny.

### Why they also want to hit something themselves ("I did that")

The plant, the bag, the phone, the chair do not look like fuses first. They look like things you could knock because you needed to.

Rage relief is first-hand: ceramic, dirt, wheels, a handset that finally shuts up. Those hits juice even when they light nothing. The chain can run without them. The player should still want to land one, during the spiral or in the wreck, and be able to point at it.

**Do not** make the printer the only thing that feels good to hit. If testers only mash the error light, the fuse failed and the vent objects were not loud enough as *hits*. Restage mass and foley. Do not add a hammer.

**Assumption:** the first-session on-ramp is the coffee. If they poke it, they get a chain on attempt one. If they then knock the plant, that hit is theirs. If they poke the plant first, they get a vent and can still light a fuse. That is Pile on. It is not a fail.

---

## The room

Portrait dollhouse cover. Not a floorplan. Not a walkable office. One still composition that still says "office" after the wreck.

**In frame (top to bottom, roughly):**

- **Ceiling strip:** hanging lamp, cord visible enough to read as a pendulum.
- **Upper / mid desk:** printer (error LED, jam tongue, LCD), coffee on the lip, fan at the back of the desk aimed across the paper, phone buzzing on the blotter. Optional frozen monitor behind, half-in-frame.
- **Lower mid:** rolling chair, slightly cockeyed, overnight bag on the seat or sliding off it.
- **Lower / slightly below the desk:** the copier, floor-standing, dark, asleep. If it sits on the fold, a short vertical peek is allowed. If the joke cannot read without peek, restage the copier into the cover. Do not add a hallway to "find" it.
- **Back corner, not the two-second read:** plant. Smashable. Quiet until you want it.

**Sleeping:** the copier. It does not hum, scan, or glow in calm. It is the stupidest thing in the room *after* it wakes. Until then it is furniture with a lid.

**Must not be in this room:**

- A hallway, kitchenette, break-room fridge, second desk, second cubicle
- People, faces, coworkers as playable characters or ragdolls
- A door you could walk through, a camera you could drive
- A tool tray, hammer, wrecking ball, or "smashables" shelf
- A window full of city / traffic (that is a different product's budget)
- A warehouse of extra printers, a plot of cubicles, a boss's office
- A PC minigame, a typing puzzle, a login screen to smash as the *goal*

One desk. One annoyance. One sleeping punchline. Everything else earns its mesh by being a fuse, a vent, or chain furniture.

---

## The items

Cap: **10** interactive objects. The frozen monitor, if present, is set dressing that may take splash; it is not a fuse and does not get a row unless art is forced to make it hittable.

**Four distinct fuses** (must differ in the *middle* of the chain, not only in the first tap). If two of these produce the same sequence, one of them is unfinished.

| # | Distinct fuse? | On-ramp? | Vent four? |
| --- | --- | --- | --- |
| Coffee cup | **Fuse A** | **Yes — first-session** | No (fuse first; still juiced if smashed dead-end) |
| Jam sheet | **Fuse B** | No | No |
| Hanging lamp | **Fuse C** | No | No |
| Phone | **Fuse D** | No | **Yes** |
| Chair | No (joins C; can be extra) | No | **Yes** |
| Plant | No | No | **Yes** |
| Overnight bag | No | No | **Yes** |

### 1. Printer — annoyance

- **Role:** named annoyance. The enemy. Not the punchline.
- **Calm:** desktop unit on the desk. Error LED blinks. LCD shows a dry jam/error (not 847 — that line belongs to the copier). One sheet hangs from the slot.
- **First-hand hit:** a cheap plastic thud and a beep. It may jiggle. Under this slice it *can* be poked (Pile on). A poke on the printer is a valid start only if it actually lights a chain (e.g. it coughs the jam toward the fan). If a printer-poke is just "smash the annoyance," it is a dead-end smash, not a fuse. Do not let mashing the LED be the best feeling in the room.
- **Chain:** victim of Fuse A (coffee in the intake). Can be yanked as collateral in Fuse B (jam still attached). May take a chair or lamp hit and still not be the joke — the copier is.

### 2. Coffee cup — fuse / on-ramp

- **Role:** **Fuse A.** First-session on-ramp. Visually loud: steam, wet ring, sits where a spill will hit the printer.
- **Calm:** ceramic cup on the tray lip. Dark coffee. Steam. The wet ring points at the intake.
- **First-hand hit:** ceramic + slosh. If they flick it off the desk as a dead-end, that is a vent with no chain — allowed, scored as `I DID THAT`, SATISFACTION stays low.
- **Chain (Fuse A, distinct mid):** cup tips into the printer intake → printer gurgles / shorts (wet death rattle, error becomes worse) → a *wet wad* of paper coughs out the jam toward the fan → fan throws it into the lamp → lamp into chair → chair into copier. Mid-chain is **wet, electrical, printer-first.** Coffee is the only fuse that murders the printer before the fan.

### 3. Jam sheet (paper) — fuse / chain fuel

- **Role:** **Fuse B.** Grabable tongue hanging from the printer. A short stack on the output tray is the same object, not a second toy.
- **Calm:** one long sheet hanging out of the slot, readable as a pull. Dry. Innocent.
- **First-hand hit:** paper flap, almost nothing, unless they yank. A tap that does not yank should feel like a miss (`That helped.` if it was empty desk; if it was the sheet, it should start to draw).
- **Chain (Fuse B, distinct mid):** player yanks/flicks the sheet toward the fan → a *dry ribbon* feeds the blades → fan chokes, hops, walks the desk → lamp cord or lamp shade takes the hop → lamp into chair → chair into copier. The printer may get dragged because the jam is still attached. Mid-chain is **ribbon + fan walk + printer as sled.** Coffee does not have to move. If this sequence becomes "paper hits fan then the same coffee path," it is unfinished — keep the ribbon and the hop.

### 4. Desk fan — furniture-that-chains

- **Role:** mid-chain engine. Not a first tap we advertise. Legal to poke.
- **Calm:** small desktop fan, **on**, aimed across the paper path. Blades readable. Hum in the bed.
- **First-hand hit:** rattle, hop, maybe a blade-tick. If they poke the fan first, it can walk into the lamp (a shorter, dumber cousin of Fuse B). That is a legal fuse-ish start; it must not clone Fuse A's wet wad. Prefer: dry hop into lamp, coffee still sitting.
- **Chain:** eats paper (wet wad from A, ribbon from B), throws or walks into the lamp. Does not wake the copier by itself.

**Assumption:** fan is ON in calm. A still fan makes Fuse B a prayer.

### 5. Hanging lamp — fuse / furniture-that-chains

- **Role:** **Fuse C.** Pendulum.
- **Calm:** pendant over the desk, cord visible, shade heavy enough to mean it.
- **First-hand hit:** a swing, a clink. Feels like knocking a hanging thing, not tapping a bulb icon.
- **Chain (Fuse C, distinct mid):** poke/flick → pendulum arc → hits the chair back → chair rockets into the **sleeping copier**. Mid-chain is **pendulum + chair flight.** Skips printer → paper → fan. Printer can stay blinking as a witness. Copier is early, not seventh. If lamp-into-chair still routes through the fan and the wet printer, Fuse C is unfinished.

### 6. Wobbly chair — vent + furniture-that-chains

- **Role:** vent four. Projectile in Fuse C. Can join other chains when hit by lamp, bag, or a sliding phone.
- **Calm:** rolling office chair, half-turned, one wheel off-true. Bag on or against it. Looks like it would go if you breathed on it.
- **First-hand hit:** mass. Wheels, a thud, a spin. This must feel like **I did that** even when it does not reach the copier. Foley + haptic on a direct poke; camera stays put unless the chair is already a chain link.
- **Chain:** lamp → chair → copier (Fuse C). May be launched by bag dump or phone hydroplane as a branch, not as a clone of C.

### 7. Phone — fuse + vent

- **Role:** **Fuse D** and vent four.
- **Calm:** mobile, face-down on the desk, buzzing. It already walks a millimeter. Ring/buzz is in the world, not a UI badge.
- **First-hand hit:** plastic crack / that handset slap. It should feel good to shut it up even if it lights nothing. Dead-end smash is legal rage relief.
- **Chain (Fuse D, distinct mid):** poke commits a longer buzz-walk → phone bumps the coffee → cup does **not** dump into the printer as the first joke (that is Fuse A). Instead: slosh becomes a slick on the desk; the phone **hydroplanes** toward the copier (off the desk onto the glass or feeder) while the cup may roll into the fan as a side branch. Mid-chain is **walking appliance + slick.** Copier wakes because there is a phone on it, then `PRINTING 1 OF 847` (of the lock screen, of nothing, of the same error — art can pick; the LCD line is the joke). If Fuse D becomes "phone tips coffee into printer" and then identical to A, it is unfinished.

**Assumption:** this is a mobile, not a landline, because Fuse D needs a walk. A landline in the background can be paint.

### 8. Plant — bystander + vent

- **Role:** vent four. Tagged bystander for `THINGS THAT DEFINITELY WEREN'T YOUR FAULT` when the *chain* knocks it. `I DID THAT` when the player knocks it.
- **Calm:** corner plant. Quiet. Not the two-second read. Looks hittable without looking like the point of the room.
- **First-hand hit:** dirt spray, pot crack, slap. Must juice on a direct hit with **no chain.** This is the rage-relief proof object for the slice.
- **Chain:** collateral only (paper, lamp, chair, coffee splash). Never required for the punchline.

### 9. Copier — punchline

- **Role:** punchline object. Sleeping. Not the named annoyance.
- **Calm:** floor-standing, lid closed, LCD dark, no scan light. Bigger than the printer. Easy to ignore until it is not.
- **First-hand hit:** a hollow lid-thump, maybe a wake-beep that does **not** start 847. Poking the copier in calm should not be the best fuse. If they mash it and it immediately prints 847, the joke is "I pressed start," not a spiral. Deny or a weak jiggle until a chain wakes it. **Assumption:** a calm poke on the copier is a joke deny or a dead-end thud, not the punchline.
- **Chain:** wakes at the end of a good spiral (or early in Fuse C / D). See Punchline.

### 10. Overnight bag — vent

- **Role:** vent four. Sunday tell: you brought a bag because this was "five minutes."
- **Calm:** dumped on the chair or sliding off it. Soft, slouchy, a strap hanging. Not steaming. Must not compete with the coffee as on-ramp.
- **First-hand hit:** dump. Charger cable, a gym shirt, something that should not be at the office. Soft mass, then clatter of whatever falls out. Feels authored. Does not need to light a chain.
- **Chain:** optional branch — dump can shove the chair (toward copier) or throw a cable at the fan. If that branch clones Fuse C, cut the chair shove and keep the dump as vent juice.

No 11th object. No mug tree *and* bag. The coffee cup is the ceramic. The bag is the Sunday mess.

---

## Punchline

**The joke:** the copier will not stop.

The printer started it. The copier finishes it at industrial volume. The quiet machine in the corner becomes the one that cannot be talked down.

**LCD (exact):** `PRINTING 1 OF 847`

Stay on `1 OF 847` long enough to read. The number may tick (`2 OF 847`, `3 OF 847`) as paper keeps coming. Do not race to 847 in the freeze. The cruelty is the *job size*, not a counter minigame.

**What it looks like when it fires:**

- Copier wakes: scan bar, lid nod, that rising multifunction scream.
- Paper waterfall from the output. It does not politely finish.
- The LCD is readable in the punchline beat. If the camera cannot show LCD + paper at once, restage — the line is the joke, not particle density.

**Freeze / live-wreck (product, not UX spec):**

- A good chain (punchline fired, chain long enough) holds a beat on the copier: LCD + first sheets of 847. That is the watch moment.
- Then the wreck **stays live.** Copier can keep vomiting paper. Plant, bag, phone, chair remain hittable. The player can still pile on.
- Do not freeze the office into an unhittable postcard while they still want to hit the plant.
- The shareable clip is fuse → chain → copier. Extra smash is the in-hand feeling. It does not have to be the clip.

**Win this situation (slice, Pile on):** under the constraint, light a chain that involves the named annoyance (printer in the spiral, as victim or as dragged sled) **or** that still fires the copier as punchline (Fuse C/D may wake the copier without killing the printer first — SATISFACTION still wants the printer *in the story*; if C/D never touch the printer, SATISFACTION should read colder than A/B). First-hand hits are the second grade (`I DID THAT`), not the win by themselves.

**Assumption (open in the PRD, picked here for this room):** one shared punchline — copier + `PRINTING 1 OF 847`. Fuse D may print the phone's lock screen instead of blank pages. That is a variant skin on the same joke, not a second punchline to author.

---

## What this room is not

Rage-room leftovers. Refuse them while staging this situation.

- A hammer tray, loadout, or "pick a tool"
- Permission to smash a warehouse of office supplies
- "Break the office" / leftover-object cleanup as the goal
- Coworkers, bosses, or ragdoll employees
- A walkable 3D office, a camera you steer, a second room
- Kitchenette, hallway, elevator, parking lot, traffic out the window
- A PC you "fix" or a typing / login puzzle
- Tutorial finger, quest log, "jam the printer" mission text
- Counting broken objects as the win
- A "smash the rest" checklist after the copier
- Making the printer the only good hit in the room
- Making extra hits steal the copier watch moment
- Two fuses that are the same chain with a different first tap
- An 11th object "because offices have staplers"

If it does not help the player **pick a fuse**, **watch a chain**, or **want one more try** (different fuse *or* a meaner hit on the plant/bag/phone/chair), it does not belong in Sunday at the office.
