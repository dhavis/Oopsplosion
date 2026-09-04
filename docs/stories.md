# Oopsplosion — testable stories

Source brief: `docs/concept.md`. Situation: `docs/office.md`. UX: `docs/office-ux.md`, `docs/ux-screen-flow.md`. Do not treat this file as a new pitch.

**Slice now** = Sunday at the office / Jammed Printer / **Pile on**. Copy: `SUNDAY AT THE OFFICE` / `The printer has opinions.` / `Poke it. Then pile on.` Finger only. Portrait. One thumb. Cover QA is the named CSS viewports in `docs/prd.md` (A–F must-pass), not a desktop monitor.

**Later MVP** = second situation (kitchen then checkout), other constraints on this same office, store listing, CLIP if export works, iOS on a Mac.

**Out** = kill list. No ticket.

QA poke IDs match `src/testLayer.ts` (`TEST_OBJECTS` / `TEST_SCRIPTS`). A tester can `poke("cup")` etc. Event strings in **Then** are the product requirement; if the build logs extras, ignore them unless they clone another fuse’s mid.

---

## Assumptions

- A **session** is one round: title, constraint, fuse choice, authored chain, a vent they can still see, punchline, verdict, instant retry. A mug that plays a paper GIF is not a session.
- Extra hits are **legal during the chain and after it**, until Retry. Camera follows the chain, not extra smash. (Locked in the PRD.)
- One shared punchline: copier LCD `PRINTING 1 OF 847`. Fuse D may print a lock-screen variant of the same joke, not a second authored punchline.
- Kitchen / checkout are later copies of this machine. **Locked:** no fourth situation, no second room, until Printer retry is proven in playtests **and** testers both **spill** and **personally smash something in frame**.
- Platform: Android-first, Capacitor APK built on Windows. iOS later, on a Mac, same web codebase.
- **Unfinished in build** (from `docs/product-evaluation.md`, post-cover-fix stills): cup-as-button (coffee script can fire while the mug sits); cover once hid plant / bag / phone / jam tongue / readable fan; `RESET ROOM` on the play surface; director beats vs contact; Fuse B jam as a wall sheet; Fuse D phone off-cover. Stories below still describe the *product* Then. Fail the story until the Then is true.

---

## Index

| Epic | IDs | Count | When |
| --- | --- | ---: | --- |
| 1. First session / chrome | S0, S1, S2, S4, A11Y | 11 | now |
| 2. Calm cover literacy | S3 | 10 | now |
| 3. Fuse A–D | OF-A, OF-B, OF-C, OF-D, OF-X | 11 | now |
| 4. Pile on / I DID THAT | VENT | 10 | now |
| 5. Punchline + wreck live | PL | 6 | now |
| 6. Verdict card + retry | CARD | 11 | now (CLIP later) |
| 7. Constraint variants | CON | 4 | 1 now / 3 later |
| 8. App in the hand | APP, IOS | 9 | Android now / iOS later |
| 9. Later situations (gated) | SIT | 3 | later, gated |
| 10. Not stories | KILL | — | out |

**Slice-now must-pass set** (12 stories — the playtest that proves a session, not that the cup is visible):

1. **S1-01** Title names the irritation over the live calm office.
2. **S2-01** Constraint `Poke it. Then pile on.` is readable, then gone.
3. **S4-03** No tutorial finger, no “tap the cup,” no quest log.
4. **S3-01** At t≈2s a stranger points at the printer.
5. **S3-04** Plant, bag, phone, chair, jam tongue, fan-as-fan, lamp, copier sliver are in the calm frame.
6. **OF-A-01** Poke coffee → mug tips off the lip **before** wet death / paper cough. (Authorship. Unfinished in build if cup-as-button.)
7. **OF-A-02** Coffee mid is wet printer → paper → fan (not a cloned lamp drop). TEST script `coffee`.
8. **VENT-03** Extra smash does not steal the camera from the chain.
9. **VENT-04** Plant juices on a direct hit with no chain; tester can point at it in frame.
10. **PL-01** Punchline LCD reads `PRINTING 1 OF 847`.
11. **PL-03** Copier beat, then wreck stays live (not a postcard).
12. **CARD-07** AGAIN reloads the same office, same constraint, no stamina.

Pass that set and you have a round. Fail any of **S3-04, OF-A-01, VENT-04** and you still have a printer SKU with a mug button.

---

## QA poke map

`TEST_OBJECTS` (cap 10 — no 11th toy):

| id | Name | Role |
| --- | --- | --- |
| `cup` | Coffee cup | Fuse A, on-ramp |
| `jam` | Jam sheet | Fuse B |
| `lamp` | Lamp | Fuse C |
| `phone` | Phone | Fuse D + vent |
| `printer` | Printer | Named annoyance |
| `fan` | Fan | Mid-chain engine |
| `chair` | Chair | Vent + Fuse C projectile |
| `plant` | Plant | Vent / bystander |
| `bag` | Bag | Vent |
| `copier` | Copier | Punchline |

`TEST_SCRIPTS` (Run chain / expect):

| Action | poke | expect (product mid) |
| --- | --- | --- |
| `clicks` | — | all ten register a hit |
| `coffee` | `cup` | `cup>printer`, `paper>fan`, `paper>lamp`, `lamp>chair`, `chair>copier`, `copier-wake` |
| `jam` | `jam` | `jam>fan`, `paper>lamp`, `lamp>chair`, `chair>copier`, `copier-wake` — **no** `cup>printer` |
| `lamp` | `lamp` | `lamp>chair`, `chair>copier`, `copier-wake` — **no** paper storm |
| `phone` | `phone` | `phone>cup`, `phone>copier`, `copier-wake` — **not** coffee-into-printer as the first joke |

---

# Epic 1 — First session / chrome

Boot, title, constraint, play. No lecture. Screen phases S0–S2, S4 from `docs/ux-screen-flow.md`.

### S0-01 — Boot wordmark

- **Story:** On launch, a stranger sees Oopsplosion’s wordmark and pitch line, then the office, without tapping Start.
- **In / out:** In: `OOPS-PLOSION` + `MAKE IT WORSE.` Out: Welcome, Tap to rage, settings gear, legal wallpaper.
- **Acceptance:**
  - **Given** a cold launch (not `?test` skip-to-play)
  - **When** the app opens
  - **Then** within ~1.5s the screen shows `OOPS-PLOSION` and `MAKE IT WORSE.` then hard-cuts to the calm office. Screenshot of boot; no “tap to start.”
- **When:** now

### S0-02 — Boot skip

- **Story:** A tap during boot skips the rest of the sting and lands on the office.
- **In / out:** In: tap anywhere skips. Out: a Start button, a second boot page.
- **Acceptance:**
  - **Given** boot is on screen
  - **When** the tester taps once
  - **Then** title or calm office is visible immediately; boot does not replay.
- **When:** now

### S1-01 — Title over the still

- **Story:** The situation title appears over the live calm office and names the printer as the jerk.
- **In / out:** In: `SUNDAY AT THE OFFICE` / `The printer has opinions.` overlay. Out: a separate art card that hides the room; kitchen/checkout titles.
- **Acceptance:**
  - **Given** a first session (not skip-to-play)
  - **When** boot ends
  - **Then** those two lines sit on the live office, then leave. VoiceOver (if on): `Sunday at the office. The printer has opinions.` Screenshot shows office + title, not a black card.
- **When:** now

### S2-01 — Constraint recedes

- **Story:** The player can state the round’s rule after one glance: poke, then pile on.
- **In / out:** In: `Poke it. Then pile on.` lower third, above the thumb rest, then gone. Out: tool tray, rubber band, timer, persistent HUD rulebook, `RESET ROOM` as the rule.
- **Acceptance:**
  - **Given** title has left
  - **When** S2 plays (or tester taps to dismiss)
  - **Then** the six-word line is readable in a screenshot; after it recedes, play chrome does not keep it as a banner. After one round, ≥80% of playtesters can paraphrase “poke then smash more” without prompting. **Unfinished in build:** test skip-to-play hides this phase; play surface has shown `RESET ROOM` instead.
- **When:** now

### S4-01 — The Finger is the only verb

- **Story:** The player pokes or flicks objects with one thumb; nothing opens a tool dock.
- **In / out:** In: tap = poke, short swipe = flick. Out: hammer, loadout, two-thumb gesture.
- **Acceptance:**
  - **Given** calm office after constraint
  - **When** the tester taps `cup` and separately short-swipes `cup`
  - **Then** both register as hits on `cup` (TEST panel note or event). No tray, no hammer icon, no second-hand required.
- **When:** now

### S4-02 — Empty desk miss

- **Story:** Poking empty desk does nothing useful and does not reload the room.
- **In / out:** In: copy `That helped.` no modal. Out: a fail screen, a scold, RESET.
- **Acceptance:**
  - **Given** calm, no chain running
  - **When** the tester taps empty desk (not an object)
  - **Then** `That helped.` appears briefly; scene stays calm; chain log stays empty.
- **When:** now

### S4-03 — No tutorial finger

- **Story:** First contact is the player’s idea; the scene does not point at the cup with UI.
- **In / out:** In: steam, lip, wet ring. Out: ghost finger, “tap here,” chevron, quest “jam the printer.”
- **Acceptance:**
  - **Given** first session through S3
  - **When** a stranger looks at a screenshot with no tester coaching
  - **Then** there is no finger ghost, outline pulse on the cup, or instructional sentence. Fail if any of those appear before first hit.
- **When:** now

### S4-04 — Chrome gone during the chain

- **Story:** Once a chain is running, the player watches physics, not UI.
- **In / out:** In: title, constraint, score, AGAIN, CLIP all hidden. Out: combo badges, `NICE`, CHAOS+12, smash HUD.
- **Acceptance:**
  - **Given** a coffee chain has started (`cup>printer` in the log)
  - **When** the tester screenshots mid-chain
  - **Then** no title, constraint, RESET ROOM, score meters, or floating +numbers. Allowed: a11y pause if VoiceOver/Switch is on.
- **When:** now

### S4-05 — No RESET ROOM on play

- **Story:** Retry lives on the end card, not as rage-room chrome on the calm/play surface.
- **In / out:** In: nothing, or the six-word constraint whisper then gone. Out: `RESET ROOM` as play HUD.
- **Acceptance:**
  - **Given** S3 calm or S4/S5 play (not the TEST panel)
  - **When** the tester looks at the play surface
  - **Then** there is no `RESET ROOM` control. Retry is only **AGAIN** on the verdict strip. **Unfinished in build:** product-evaluation recorded RESET ROOM on the play chrome.
- **When:** now

### A11Y-01 — Reduce Motion still gets a chain

- **Story:** A Reduce Motion player still sees the spiral, without shake or speed-ramp slow-mo.
- **In / out:** In: longer freeze on the same 2–3 links; punchline LCD still readable. Out: turning the joke into a slideshow of menus.
- **Acceptance:**
  - **Given** OS Reduce Motion on
  - **When** Fuse A runs to punchline
  - **Then** `copier-wake` still fires; no screen shake; peaks are holds not ramps; LCD `PRINTING 1 OF 847` is readable in a still.
- **When:** now

### A11Y-02 — VoiceOver calm and card only

- **Story:** TalkBack names the situation and the cup, then shuts up during the chain.
- **In / out:** In: title, constraint, `Coffee cup, on the edge.`, card stats, AGAIN. Out: narrating every collision.
- **Acceptance:**
  - **Given** VoiceOver on, calm
  - **When** focus moves to the cup, then the tester starts a chain
  - **Then** calm announces the cup; first contact may say `Watch. You can still hit things.` then silence until the card.
- **When:** now

---

# Epic 2 — Calm cover literacy

S3. Two-second read. Objects in frame. If the cup only fits by deleting vents, the cover failed.

### S3-01 — Two-second printer

- **Story:** Pause at two seconds and a stranger can point at the jammed printer as the irritation.
- **In / out:** In: error LED, jam tongue, printer box in the working band. Out: a quest log, VO explaining the printer.
- **Acceptance:**
  - **Given** calm, t≈2s, 0 chain events, 0 papers (same bar as product-evaluation stills)
  - **When** a stranger is shown a screenshot with no labels
  - **Then** they point at the printer first (or tied with the cup as “that will go in”). Fail if they ask where the game is, or point at a doorway / empty room.
- **When:** now

### S3-02 — Cup is the dare, not a SKU badge

- **Story:** The coffee cup reads as an accident waiting to hit the intake, not as a Play button on a product shot.
- **In / out:** In: on the lip, steam (or Reduce Motion: wet ring + lip), wet ring aiming at the tray. Out: a second steaming mug; magnet that always scores.
- **Acceptance:**
  - **Given** calm screenshot
  - **When** a stranger is asked what they would poke
  - **Then** they name the cup and say it will go into the printer (spill vector), not “smash the mug for debris.” Steam or wet ring is visible without a UI arrow.
- **When:** now

### S3-03 — Copier sliver in calm

- **Story:** The sleeping punchline is in the calm frame; peek is optional greed, not literacy.
- **In / out:** In: a readable sliver of floor-standing copier, dark, not blinking. Out: hallway to “find” it; peek chevron.
- **Acceptance:**
  - **Given** calm, no vertical drag
  - **When** QA names what is at the bottom of the readable frame
  - **Then** they say there is a copier (lid, tray, or bulk). Fail if they need peek to know a fat machine is waiting.
- **When:** now

### S3-04 — Situation cover, not printer SKU

- **Story:** Quieter fuses and vents are in the same still as printer + cup, so retry and pile-on have bait.
- **In / out:** In: lamp, fan-as-fan, jam as a hanging tongue, phone, chair, plant, bag, copier sliver. Out: cropping those to save the cup; plant only via peek; a different crop per phone SKU.
- **Acceptance:**
  - **Given** calm screenshot, no drag, on each must-pass viewport **A–F** from `docs/prd.md` (360×780, 360×800, 390×844, 393×852, 412×915, 430×932). Chrome device mode is legal; a 1920×1080 desktop window is not.
  - **When** QA circles objects
  - **Then** all of these are at least partially in frame and recognizable: `lamp`, `fan` (blades, not a valve), `jam` (tongue out of the slot), `phone`, `chair`, `plant`, `bag`, copier sliver. Fail a viewport if any of those left the no-drag frame. **Unfinished in build:** evaluation stills hid plant / bag / phone / jam tongue / readable fan to keep the cup.
- **When:** now

### S3-05 — One blink

- **Story:** Only the printer’s error LED behaves like an alarm in calm.
- **In / out:** In: one slow ugly blink on the printer. Out: copier ready light, phone LED war, lamp strobe, steam-as-blink.
- **Acceptance:**
  - **Given** 3s of calm video
  - **When** QA counts blinking lights
  - **Then** exactly one: printer error LED. Fan blades may spin (mechanical). Steam may lift (not a blink). Copier LCD is dark.
- **When:** now

### S3-06 — Locked portrait dollhouse

- **Story:** The player inspects a cover, not a walkable office.
- **In / out:** In: locked camera; optional short vertical peek; the same 9:16 cover on every phone in the cluster. Out: walk, orbit, pinch, horizontal pan, a door; a restage when the aspect is 20:9 instead of 19.5:9.
- **Acceptance:**
  - **Given** calm, on viewport **A** (360×780) and **E** (412×915) at minimum
  - **When** the tester pinches, two-finger rotates, or swipes horizontally
  - **Then** the camera does not orbit or zoom; objects do not fling from a peek drag. Peek, if any, is vertical, damped, lift-to-settle. The office is the same composition as on 9:16 — extra height is gutter in the 12%/18% bands, not a new room.
- **When:** now

### S3-07 — Peek is not the mug hunt

- **Story:** If they drag vertically, they see extra copier bulk; they do not discover the cup or the plant.
- **In / out:** In: optional peek of overflow. Out: teaching peek; cup or plant only below the fold.
- **Acceptance:**
  - **Given** S3-04 already passed (cup and plant in the no-drag frame)
  - **When** the tester peeks then releases
  - **Then** camera settles; no object was flung; literacy did not depend on the drag.
- **When:** now

### S3-08 — Ten objects register a poke

- **Story:** Every listed office toy is hittable; there is no secret 11th smashable.
- **In / out:** In: the ten `TEST_OBJECTS`. Out: PC as a toy, stapler, mug tree, frozen monitor as a fuse.
- **Acceptance:**
  - **Given** TEST action `clicks`
  - **When** QA pokes `cup`, `jam`, `lamp`, `phone`, `printer`, `fan`, `chair`, `plant`, `bag`, `copier`
  - **Then** panel reads `PASS — all ten objects registered a click.` Frozen PC, if visible, does not appear as an 11th hit target (sticky pick prefers cup/printer/desk).
- **When:** now

### S3-09 — Sticky cup, not whole-band magnet

- **Story:** Fat-finger near the mug prefers the cup; jam tongue and lamp stay tappable.
- **In / out:** In: ≥56 dp hits; 60% cup / 40% desk = cup. Out: entire working band is the mug.
- **Acceptance:**
  - **Given** calm
  - **When** the tester taps the jam tongue, then the lamp (not the cup silhouette)
  - **Then** TEST hits `jam` then `lamp`, not `cup`. A tap on the cup body hits `cup`.
- **When:** now

### S3-10 — Calm is eyes and ears

- **Story:** Before the first hit, the irritation is sound and blink, not rumble.
- **In / out:** In: printer stutter, far phone buzz, fan hum. Out: haptic bed in calm; steam hiss drowning the grind.
- **Acceptance:**
  - **Given** sound on, calm, no contact yet
  - **When** the tester waits 3s
  - **Then** they can hear printer stutter and/or phone buzz; device does not haptic until a hit.
- **When:** now

---

# Epic 3 — Fuse A–D

Four fuses must differ in the **middle**, not only the first tap. If two share a sequence, one is unfinished — the Then still stands.

### OF-A-01 — Spill is the fuse

- **Story:** Poking the coffee cup tips it into the printer; a seated mug must not start the coffee movie.
- **In / out:** In: visible dump off the lip, then wet death. Out: 450ms “you touched it, play coffee” while the cup sits; auto-aim that always scores a flick away from the tray.
- **Acceptance:**
  - **Given** calm, `poke("cup")` or a thumb poke on the cup
  - **When** the chain starts
  - **Then** a screenshot before `ERR / WET` / paper cough shows the mug **off** the tray or clearly tipping toward the intake. Fail if event `cup>printer` fires while the cup is still seated upright. A flick *away* from the printer may miss (short wet mess or `That helped.`); do not magnet the win. **Unfinished in build:** evaluation `room3d-poke.png` — cup still sitting, `cup>printer`, papers coughing.
- **When:** now

### OF-A-02 — Coffee mid is wet, printer-first

- **Story:** Fuse A murders the printer with coffee, then paper feeds the fan — that mid is unique to the cup.
- **In / out:** In: wet electronics then paper storm. Out: lamp→chair as the first interesting beat.
- **Acceptance:**
  - **Given** TEST action `coffee`, Run chain (or poke `cup` after a real spill per OF-A-01)
  - **When** the run finishes (≤12s panel window)
  - **Then** log contains `cup>printer`, `paper>fan`, `paper>lamp`, `lamp>chair`, `chair>copier`, `copier-wake` in an order that still has **wet printer before fan**. Printer LCD/error becomes worse (wet), not a dry ribbon-first. Coffee is the only fuse that soaks the printer before the fan.
- **When:** now

### OF-A-03 — Attempt-one on-ramp

- **Story:** A first-time player who pokes the cup gets a 3+ event chain in the first session without a lecture.
- **In / out:** In: median &lt;45s from situation load; ≥70% of testers get 3+ events in 2 minutes. Out: coaching, ghost finger.
- **Acceptance:**
  - **Given** first-time testers, sound on, no spoken tutorial
  - **When** they play from boot
  - **Then** if they poke the cup, chain length ≥3 inside the first 2 minutes. Time-to-first-chain median &lt;45s for that path. Fail the slice expansion if this misses — restage the cup, do not add kitchen.
- **When:** now

### OF-B-01 — Jam yank mid is ribbon + fan

- **Story:** Yanking the jam feeds a dry ribbon into the fan; the printer may sled, coffee need not move.
- **In / out:** In: `jam>fan`, hop/walk, skip wet death. Out: paper hits fan then the same coffee path.
- **Acceptance:**
  - **Given** TEST action `jam`, poke `jam`
  - **When** the chain runs
  - **Then** expect `jam>fan`, `paper>lamp`, `lamp>chair`, `chair>copier`, `copier-wake`. Log does **not** require `cup>printer`. Cup can stay on the lip. Mid-chain reads dry ribbon + fan hop, not slosh. If this becomes “paper then identical to A,” fail — unfinished.
- **When:** now

### OF-B-02 — Jam is a pullable tongue

- **Story:** Fuse B is a sheet hanging out of the printer slot, not a postcard on a wall.
- **In / out:** In: readable pull from the jam. Out: a decorative sheet that is not the poke target.
- **Acceptance:**
  - **Given** calm screenshot
  - **When** QA pokes the hanging paper on the printer
  - **Then** hit registers as `jam` and OF-B-01 can start. Fail if the tappable jam is a sheet leaning on a cabinet while the slot has no tongue. **Unfinished in build:** evaluation called Fuse B a sheet against a wall.
- **When:** now

### OF-C-01 — Lamp skips the paper storm

- **Story:** Poking the hanging lamp swings it into the chair into the copier, with little or no paper flock.
- **In / out:** In: pendulum + chair flight; copier early. Out: lamp routing through wet printer and fan as a clone of A.
- **Acceptance:**
  - **Given** TEST action `lamp`, poke `lamp`
  - **When** the chain runs
  - **Then** `lamp>chair`, `chair>copier`, `copier-wake`. Printer can stay blinking as a witness. No required `cup>printer` or `paper>fan`. If lamp-into-chair still routes through the fan and wet printer, fail — unfinished.
- **When:** now

### OF-D-01 — Phone walk / hydroplane

- **Story:** Poking the phone makes it walk; the joke is a walking appliance on a slick, not coffee dumped into the printer.
- **In / out:** In: `phone>cup` then phone toward copier (`phone>copier`), copier wakes. Out: phone tips coffee into printer then identical to A.
- **Acceptance:**
  - **Given** TEST action `phone`, poke `phone` (phone must be in frame per S3-04)
  - **When** the chain runs
  - **Then** `phone>cup`, `phone>copier`, `copier-wake`. Cup does **not** dump into the printer as the first joke (`cup>printer` must not be the spine). Mid is buzz-walk + slick / hydroplane. LCD may show 847 of a lock screen — same punchline skin. If Fuse D is “phone tips coffee into printer” = A, fail — unfinished. **Unfinished in build:** phone missing from the still.
- **When:** now

### OF-X-01 — Four mids are actually different

- **Story:** A tester who runs A then B then C then D can tell the middles apart without looking at the first tap.
- **In / out:** In: four quoted mids (wet / ribbon / pendulum / walk). Out: four buttons that play one timeline.
- **Acceptance:**
  - **Given** four recordings or TEST runs (`coffee`, `jam`, `lamp`, `phone`)
  - **When** a stranger watches from after the first contact
  - **Then** they can match each clip to wet-printer, ribbon-fan, lamp-chair, phone-walk. Fail if two expect lists collapse to the same event spine. SATISFACTION may read colder on C/D if the printer never joins the story (office bible).
- **When:** now

### OF-X-02 — Printer poke is legal and lame

- **Story:** Under Pile on, mashing the annoyance beeps; it is not the best fuse and not a dead tap.
- **In / out:** In: error beep, maybe jam shiver, 0–2 events, no copier, no slow-mo peak. Out: Hands-off deny (later); printer as the juiciest hit in the room.
- **Acceptance:**
  - **Given** calm, Pile on
  - **When** the tester pokes only `printer` and waits
  - **Then** a beep/jiggle is audible/visible; `copier-wake` does not fire; chain length ≤2. Card may read `YOU JUST POKED IT.` / `YOU JUST HIT THINGS.` if they also smash vents. Constraint does not scold.
- **When:** now

### OF-X-03 — Calm copier is not Start

- **Story:** Poking the sleeping copier does not print 847; the joke is receiving a chain, not pressing Start.
- **In / out:** In: hollow thud or joke deny, no punchline. Out: mash-copier-to-win.
- **Acceptance:**
  - **Given** calm
  - **When** the tester pokes only `copier`
  - **Then** LCD does not show `PRINTING 1 OF 847`; no paper waterfall. Note may be a thud/deny. Punchline still requires a chain wake (`copier-wake` from A–D).
- **When:** now

### OF-X-04 — Fan-first is a dumber cousin of B, not A

- **Story:** Poking the fan can hop into the lamp without cloning the wet coffee sentence.
- **In / out:** In: dry hop, coffee still sitting. Out: fan poke that teleports into `cup>printer`.
- **Acceptance:**
  - **Given** calm, poke `fan` only
  - **When** anything chains
  - **Then** cup remains unspilled unless later contact. If a chain starts, it must not log `cup>printer` as the first link. Legal to reach lamp → chair → copier as a short B-cousin.
- **When:** now

---

# Epic 4 — Pile on / I DID THAT

Vent four: `plant`, `bag`, `phone`, `chair`. Extra smash is authorship, not leftover cleanup mode.

### VENT-01 — Extra hits legal during the chain

- **Story:** While the spiral runs, the player can still poke another object and that hit is theirs.
- **In / out:** In: Finger contacts smash. Out: One poke (later); extra taps that jiggle nothing.
- **Acceptance:**
  - **Given** coffee chain running (after `cup>printer`)
  - **When** the tester pokes `plant`
  - **Then** plant registers a hit (TEST note or dirt/pot motion) before Retry. Chain continues. No UI banner.
- **When:** now

### VENT-02 — Extra hits legal after the chain until Retry

- **Story:** After the punchline beat, the wreck is still a physics toy until AGAIN.
- **In / out:** In: S5b live wreck. Out: freeze-frame postcard; “smash the rest” checklist.
- **Acceptance:**
  - **Given** `copier-wake` has fired and pull-back has happened
  - **When** the tester pokes `bag` or `chair` before AGAIN
  - **Then** that object moves/breaks; no remaining-count; no outlines.
- **When:** now

### VENT-03 — Camera stays on the chain

- **Story:** Pile-on does not get its own cinebot; the lens stays on the spiral.
- **In / out:** In: follow chain cause, next victim framed. Out: camera chase of the plant slap; follow last flying paper as the subject.
- **Acceptance:**
  - **Given** chain approaching copier (chair or paper still the active link)
  - **When** the tester flicks `plant` during that beat
  - **Then** a recording shows the lens still on printer/fan/lamp/chair/copier, not a cut to the plant. Plant juices in place. Fail if follow target is last spawned paper.
- **When:** now

### VENT-04 — Plant is the rage-relief proof

- **Story:** Knocking the plant with no chain feels like a hit the player can point at.
- **In / out:** In: dirt, pot crack, closer foley, haptic tick; in frame. Out: plant off-cover; plant that always joins the official sentence.
- **Acceptance:**
  - **Given** calm, tester pokes only `plant`
  - **When** contact lands
  - **Then** pot/leaves react (dirt or tip); tester can screenshot and point at the plant. Chain log has no `copier-wake` required. ≥70% of first-session testers personally wreck ≥1 extra object they can point at within 2 minutes — plant is the intended proof object. **Unfinished in build:** plant off-cover.
- **When:** now

### VENT-05 — Bag dump is authored vent

- **Story:** Hitting the overnight bag feels like messing with someone’s stuff, not lighting Fuse C.
- **In / out:** In: fabric dump / contents clatter. Out: bag shove that clones lamp→chair→copier as the only outcome.
- **Acceptance:**
  - **Given** poke `bag` in calm
  - **When** it dumps
  - **Then** a visible dump/spill; if the chair moves toward the copier, copier must not wake solely from a bag clone of C — keep dump as vent juice if that branch clones C.
- **When:** now

### VENT-06 — Chair mass is a vent even when it misses the copier

- **Story:** A direct poke on the chair is a heavy hit the player owns, not only a Fuse C cutscene.
- **In / out:** In: wheels, thud, haptic. Out: calm chair so twitchy it starts the chain without a hit.
- **Acceptance:**
  - **Given** poke `chair` in calm
  - **When** it is a dead-end (does not reach copier)
  - **Then** chair moves with mass; `copier-wake` may be absent; tester still calls it their hit. Camera stays unless the chair is already a chain link.
- **When:** now

### VENT-07 — Phone smash can shut it up

- **Story:** Slapping the phone is legal rage relief even if Fuse D does not run.
- **In / out:** In: crack / ring cut, dead-end OK. Out: phone LED blink competing with the printer.
- **Acceptance:**
  - **Given** poke `phone` hard as smash, or a second hit after a failed walk
  - **When** it is a dead-end
  - **Then** buzz/ring stops or cracks; `I DID THAT` can count this if it was not the fuse object (fuse object is “their idea,” not this stat — if phone *was* the fuse, extra later hits on other objects still count).
- **When:** now

### VENT-08 — Dual authorship is readable

- **Story:** After one round, the player can point at something the chain broke and something they broke.
- **In / out:** In: ≥80% of testers can do both. Out: “I watched a GIF” or “I only smashed.”
- **Acceptance:**
  - **Given** a round that included a 3+ chain **and** one extra hit on `plant` / `bag` / `chair` / `phone`
  - **When** asked “what wasn’t your fault?” and “what did you do?”
  - **Then** they point at a chain object they never poked (paper in fan, copier, swinging lamp) **and** at their extra object. Fail if they only say rage room, or only say watch the copier.
- **When:** now

### VENT-09 — Plant scoring split

- **Story:** If the chain knocks the plant, that is FAULT; if they knock it, that is I DID THAT.
- **In / out:** In: tagged bystander. Out: double-counting the same plant on both stats.
- **Acceptance:**
  - **Given** two runs: (1) coffee chain knocks plant, player never pokes plant; (2) player pokes plant as extra, chain does not knock it
  - **When** both cards are compared
  - **Then** run 1: plant in FAULT, not I DID THAT. Run 2: plant in I DID THAT, not FAULT. Same plant cannot inflate both.
- **When:** now

### VENT-10 — No smash HUD

- **Story:** Extra hits juice with foley and haptic, not badges.
- **In / out:** In: tick + closer foley. Out: combo, +1, CHAOS popup on collision.
- **Acceptance:**
  - **Given** VENT-01 during a chain
  - **When** the extra hit lands
  - **Then** screenshot has no floating score; haptic tick (if haptics on) then chain thud if a link lands the same frame — not mushed into one rumble.
- **When:** now

---

# Epic 5 — Punchline + wreck live

The copier will not stop. Then they can still hit the plant.

### PL-01 — LCD line is the joke

- **Story:** When the punchline fires, a stranger can read `PRINTING 1 OF 847`.
- **In / out:** In: that exact string, held long enough to read; tick 2/847 allowed, no race to 847. Out: particle density as the joke; printer LCD showing 847 in calm.
- **Acceptance:**
  - **Given** a chain that wakes the copier
  - **When** the punchline beat hits
  - **Then** screenshot of copier LCD shows `PRINTING 1 OF 847`. Calm printer LCD was a jam/error, not 847.
- **When:** now

### PL-02 — Copier wakes stupid

- **Story:** The sleeping machine becomes industrial: scan/lid/scream and paper that will not finish.
- **In / out:** In: wake + waterfall. Out: one polite sheet and done.
- **Acceptance:**
  - **Given** `copier-wake`
  - **When** the tester watches 2s
  - **Then** paper keeps coming from the copier (not a single sheet). Copier was dark in calm (S3-05).
- **When:** now

### PL-03 — Beat, then live wreck

- **Story:** A good chain holds on the copier, then the office stays hittable.
- **In / out:** In: 400–600 ms hold or slow-mo on the link, then pull-back. Out: freeze the world into an unhittable postcard.
- **Acceptance:**
  - **Given** punchline fired and chain long enough for the beat
  - **When** the hold ends
  - **Then** tester can still poke `plant` (VENT-02). Copier may keep vomiting paper. Reduce Motion may freeze wreck (A11Y-01 exception).
- **When:** now

### PL-04 — Pull-back still says office

- **Story:** After the copier scream, the camera shows a wrecked office, not a copier macro.
- **In / out:** In: calm framing, wrecked. Out: zoom that loses the room.
- **Acceptance:**
  - **Given** S5b / S6
  - **When** a screenshot is taken
  - **Then** a stranger still says “office”; plant or chair or bag is aimable outside the dim strip.
- **When:** now

### PL-05 — Slow-mo is for links, 2–3 times

- **Story:** Time bends on chain links, not on every debris puff or every extra slap.
- **In / out:** In: 2–3 peaks, 350–700 ms. Out: twelve slow-mos; slow-mo on a dead-end plant slap.
- **Acceptance:**
  - **Given** a full coffee chain
  - **When** QA counts speed ramps (or Reduce Motion holds)
  - **Then** 2–3 peaks on links (e.g. coffee-into-printer, paper-into-fan, chair-into-copier). Extra-only hits stay 1×.
- **When:** now

### PL-06 — Watch moment survives pile-on

- **Story:** Extra smash during the copier scream does not skip or hide 847.
- **In / out:** In: LCD readable; smash in place. Out: camera steal; punchline skipped.
- **Acceptance:**
  - **Given** chair-into-copier / wake
  - **When** tester pokes `plant` during that second
  - **Then** PL-01 still true in the same round; VENT-03 still true.
- **When:** now

---

# Epic 6 — Verdict card + retry

S6 overlay on **live** wreck. Four joke stats. AGAIN is the product.

### CARD-01 — Four stats, exact labels

- **Story:** The end strip shows four named joke stats, not a damage meter.
- **In / out:** In: `CHAOS`, `SATISFACTION`, `THINGS THAT DEFINITELY WEREN'T YOUR FAULT`, `I DID THAT`. Out: Damage/Precision/Combo six-axis; shortened “FAULTS”; renaming I DID THAT to HITS.
- **Acceptance:**
  - **Given** a round has a verdict
  - **When** the dim strip is up
  - **Then** screenshot contains those four labels. SATISFACTION may exceed 100%. FAULT wraps two lines. No stars, +XP, Great job, objects remaining.
- **When:** now

### CARD-02 — CHAOS is the chain, not smash-more

- **Story:** Personally smashing the plant does not win CHAOS; a longer chain does.
- **In / out:** In: CHAOS from unpushed objects / link length. Out: CHAOS+ on extra taps.
- **Acceptance:**
  - **Given** two runs, same coffee fuse: (1) watch only; (2) watch + poke plant and bag
  - **When** cards are compared
  - **Then** CHAOS stays in the same band; run 2 has higher `I DID THAT`. A third run that only mashes plant (no chain) has low CHAOS and non-zero `I DID THAT`.
- **When:** now

### CARD-03 — SATISFACTION is the joke

- **Story:** Lighting printer → paper → fan → copier beats knocking only the plant.
- **In / out:** In: named annoyance in chain, punchline, long link. Out: SATISFACTION from leftover smash volume.
- **Acceptance:**
  - **Given** run A: OF-A-02 to punchline, few extras. Run B: only `plant` + maybe `printer` poke, no copier
  - **When** SATISFACTION is compared
  - **Then** A > B. High CHAOS + low SATISFACTION is allowed on a mess that missed 847. High I DID THAT + low SATISFACTION is allowed if they vented and missed the joke.
- **When:** now

### CARD-04 — FAULT counts what they never touched

- **Story:** Chain wreckage they didn’t poke feeds FAULT; their extra pokes do not.
- **In / out:** In: bystander weight for chain-knocked plant. Out: counting the fuse object as FAULT.
- **Acceptance:**
  - **Given** coffee fuse that wrecks untouched neighbors vs a poke that only jostles two
  - **When** FAULT integers are compared
  - **Then** the longer indirect run scores higher FAULT. Player-poked extras are absent from FAULT (see VENT-09).
- **When:** now

### CARD-05 — Fuse object is not I DID THAT

- **Story:** The first-touch fuse is “that was my idea,” not extra wreckage.
- **In / out:** In: extra contacts after the fuse (and dead-end smashes that don’t chain) count. Out: double-counting the cup on I DID THAT.
- **Acceptance:**
  - **Given** poke only `cup`, chain runs, no extra objects
  - **When** the card shows
  - **Then** `I DID THAT` is `0` (or does not include `cup`). A second run that also pokes `plant` shows a higher `I DID THAT`.
- **When:** now

### CARD-06 — Headline matches the round

- **Story:** The one-liner on the strip is earned by what happened, not a random roast.
- **In / out:** In: PRD table. Out: Great job; MAKE IT WORSE on a 2-hit flop.
- **Acceptance:**

| Given | Then headline includes |
| --- | --- |
| Punchline fired and chain length ≥ 4 | `THAT ESCALATED QUICKLY.` |
| Punchline fired and I DID THAT ≥ 3 | `THE PRINTER STARTED IT.` (office) |
| Chain 2–3, punchline missed, I DID THAT ≥ 3 | `YOU NEEDED THAT.` |
| Chain 2–3, punchline missed, low extras | `THAT WAS JUST A MESS.` |
| Chain ≤ 1, extras happened | `YOU JUST HIT THINGS.` |
| Chain ≤ 1, no extras | `YOU JUST POKED IT.` |

Huge spiral may use `MAKE IT WORSE.` `I DID THAT.` as headline is rare; keep it as the stat.

- **When:** now

### CARD-07 — AGAIN is instant retry

- **Story:** One tap reloads the same jammed printer, same Pile on, because they saw another fuse or a meaner plant hit.
- **In / out:** In: hard cut to S3, &lt;0.4s perceived. Out: stamina, ad, map, constraint change, Round 2 copy.
- **Acceptance:**
  - **Given** S6 with AGAIN ≥72×56 dp in the thumb zone
  - **When** the tester taps AGAIN
  - **Then** calm office returns, same title/constraint path (or skip to calm of **this** situation). No spinner on black. Median playtesters take ≥2 extra attempts before they say they are done; majority cite a different fuse or meaner extra hit, not a gate. Ghost: last **fuse** silhouette ~15% opacity ~0.6s, then gone — do not ghost every extra smash.
- **When:** now

### CARD-08 — Wreck smash around the strip

- **Story:** Taps on the dim strip’s buttons are buttons; taps on the wreck still smash.
- **In / out:** In: overlay, copier visible in gaps. Out: solid sheet that eats the plant; swipe-to-dismiss that retries.
- **Acceptance:**
  - **Given** S6 visible
  - **When** tester taps AGAIN vs taps plant (outside button rects)
  - **Then** AGAIN retries; plant smash still registers. Strip does not cover the last vent target (shrink strip, don’t steal vent).
- **When:** now

### CARD-09 — Fuse ghost on retry

- **Story:** Retry briefly shows which fuse they just used, then the cover is honest again.
- **In / out:** In: last fuse only. Out: ghost hand tutorial; checklist of smashed vents.
- **Acceptance:**
  - **Given** a coffee round, then AGAIN
  - **When** calm loads
  - **Then** cup (or last fuse) may ghost ~0.6s at ~15% opacity, then full opacity cover with no persistent outline.
- **When:** now

### CARD-10 — CLIP shares the chain or is absent

- **Story:** If the build can export a 5–15s chain replay, CLIP shares that; if not, CLIP is not shown.
- **In / out:** In: system sheet, prefill `The printer started it.`, watermark OOPS-PLOSION on the video. Out: `CLIP (SOON)`; sharing the stats card; smash-more montage unless a smash was a link.
- **Acceptance:**
  - **Given** punchline fired and export works
  - **When** tester taps CLIP
  - **Then** OS share sheet opens with chain footage fuse→punchline. If export does not work, CLIP control is omitted.
- **When:** later MVP (or now only if export is real)

### CARD-11 — Grade, not fail-lock

- **Story:** Every round ends in a verdict they can retry; nothing times out the joke.
- **In / out:** In: soft miss lines. Out: stars-as-stamina, come back in 20 minutes, interrupt chain with IAP.
- **Acceptance:**
  - **Given** OF-X-02 printer-only round
  - **When** the card appears
  - **Then** AGAIN is available; no locked content; no ad gate. Chain was never paused by a banner.
- **When:** now

---

# Epic 7 — Constraint variants

Pile on is the slice. Other rules replay **this office** later. Do not build kitchen to get a second constraint.

### CON-01 — Pile on is the slice rule

- **Story:** Extra Finger contacts smash; first touch is still a fuse choice.
- **In / out:** In: this vertical slice. Out: treating Pile on as a tutorial for One poke.
- **Acceptance:** Covered by S2-01, S4-01, VENT-01, VENT-02. Fail CON-01 if extra taps jiggle nothing (except empty desk S4-02).
- **When:** now

### CON-02 — One poke (same office, later)

- **Story:** The player may make exactly one contact; further taps do nothing; I DID THAT stays 0.
- **In / out:** In: copy `One poke. That's the whole budget.` Further taps: `You spent it.` Out: slice default; timer-as-puzzle.
- **Acceptance:**
  - **Given** this constraint on Jammed Printer (after slice retry is proven)
  - **When** tester pokes `cup` then `plant`
  - **Then** plant does not move; copy `You spent it.`; card `I DID THAT` is `0`. Chain from the one poke still works.
- **When:** later MVP

### CON-03 — Hands off the printer (same office, later)

- **Story:** Tapping the named annoyance denies; fuses start elsewhere; extra hits on other objects stay legal.
- **In / out:** In: `Hands off the printer. Pile on the rest.` Deny: `Nice try.` Out: slice Pile on; locking all smash.
- **Acceptance:**
  - **Given** this constraint
  - **When** tester taps `printer` then `cup` then `plant`
  - **Then** printer: beep, no chain, `Nice try.`; cup can still light a chain; plant extra hit counts.
- **When:** later MVP

### CON-04 — Constraint matrix, not a new room

- **Story:** After Printer retry is proven, the next content experiment is One poke or Hands off on **this** desk, before buying kitchen — if budget pinches.
- **In / out:** In: 3 situations × 3 constraints as later MVP math. Out: a fourth situation; traffic jam.
- **Acceptance:**
  - **Given** product decision to expand
  - **When** the team ships the next playable round
  - **Then** it is either CON-02, CON-03, or situation 2 (SIT-01) — not a new office, not a hammer, not daily revenge.
- **When:** later MVP

**Not stories (constraints):** 30-second timer as the puzzle; “no hands” / “do not touch anything”; “only 3 objects” as a mode; One rubber band in the first three situations. Rubber band is a later named constraint, not a loadout.

---

# Epic 8 — App in the hand

Android-first APK on Windows. iOS stories explicitly wait for a Mac.

### APP-01 — Install the APK

- **Story:** A tester with an Android phone can install the Oopsplosion APK and reach S0 without a PC browser.
- **In / out:** In: Capacitor APK, cold launch to boot. Out: requiring USB debugging as the only path for playtesters (dev OK; playtest wants sideload).
- **Acceptance:**
  - **Given** APK built from this web codebase
  - **When** installed and opened on a phone
  - **Then** S0-01 runs; office loads. Note device + OS in the playtest log.
- **When:** now

### APP-02 — Portrait is the game

- **Story:** The session is portrait only; one thumb. Landscape is not a product orientation. One 9:16 cover survives the phone cluster.
- **In / out:** In: authored 9:16; survive ~19.5:9–20:9 via safe areas; rotate = lock portrait or pillarbox the same 9:16 cover; canonical CSS viewports in `docs/prd.md`. Out: landscape restage; dual-mode toggle; iPad cinema; landscape store art; two-hand layout; unique layout per SKU; iPad 3:4 as a first-class layout; Fold-unfold tablet mode.
- **Acceptance:**
  - **Given** each must-pass viewport **A–F** (CSS px, portrait): **360×780**, **360×800**, **390×844**, **393×852**, **412×915**, **430×932**. Proxies: Galaxy S26, Galaxy A07, iPhone 17e/12–14, iPhone 15/16, Pixel 8/9 or Galaxy A17, iPhone Plus. Chrome device mode is legal for this story; a landscape desktop window is not.
  - **When** a round is completed (or calm + S6 screenshots if a full round is impractical on a simulator)
  - **Then** title, constraint, fuses, AGAIN are usable in that portrait cover without rotating. Printer blink, cup, and copier sliver sit in the middle ~70%. If they rotate, the same 9:16 cover stays locked or pillarboxed — crash-prevention, not a second mode. Never restage. Never a dual-mode toggle. Cluster-edge **G–J** (384×832, 402×874, 414×896, 440×956) fail only if an essential silhouette is eaten.
- **When:** now

### APP-03 — One thumb, whole round

- **Story:** 100% of testers finish a round without a second hand.
- **In / out:** In: objects in-world; AGAIN in thumb zone. Out: pinch, two-thumb combo, orbit.
- **Acceptance:**
  - **Given** playtest phones
  - **When** testers play S0→AGAIN
  - **Then** zero testers need a second hand. Session including retries fits 1–5 minutes typical.
- **When:** now

### APP-04 — Audio carries the irritation and the sentence

- **Story:** With sound on, calm bed and chain foley are audible without a HUD novel.
- **In / out:** In: printer stutter, ceramic slosh, copier scream. Out: orchestra on boot; music louder than foley.
- **Acceptance:**
  - **Given** media volume audible, ringer optional
  - **When** calm then coffee chain
  - **Then** tester can name printer grind in calm and copier/paper in the chain. Boot is a short dry sting, not a title theme that blocks S1.
- **When:** now

### APP-05 — Haptics match hit grammar

- **Story:** Calm is still; fuse/extra is a tick; chain links thud; card arrival can hit once longer.
- **In / out:** In: respect system haptic off (foley still works). Out: rumble bed; chorded mush on same-frame tick+thud.
- **Acceptance:**
  - **Given** haptics on
  - **When** poke plant (extra) vs coffee-into-printer (link) vs S6 strip in
  - **Then** extra = short tick; link = heavier thud; strip = one longer hit. With haptics off, no vibrate; sound still distinguishes.
- **When:** now

### APP-06 — 60fps bar on target phones

- **Story:** The chain stays readable; we do not sell debris quality as the product.
- **In / out:** In: events readable (paper hits fan) at playable frame rate. Out: shipping a 20fps slideshow as juice.
- **Acceptance:**
  - **Given** a mid-range Android used for playtest (name it)
  - **When** OF-A-02 runs
  - **Then** QA records whether frame pacing stays near 60 on that device **or** drops are brief; chain links still identifiable. Fail if hitching hides OF-A-01 spill or PL-01 LCD.
- **When:** now

### APP-07 — Safe areas

- **Story:** Notch and home indicator do not eat the cup, the blink, or AGAIN.
- **In / out:** In: top 12% / bottom 18% clear of essential silhouettes; AGAIN in thumb rest; extra 20:9 height stays in those bands. Out: cup under the finger park; a restage to "use the extra pixels."
- **Acceptance:**
  - **Given** a notched Android **and** an iPhone-class viewport from APP-02 (at least **A** 360×780 and **C** or **D** 390×844 / 393×852)
  - **When** calm + S6 screenshots
  - **Then** printer blink and cup sit in the middle ~70%; AGAIN is in the bottom thumb zone and hittable. Fail if the cup or blink sits in the top 12% or AGAIN sits under a home indicator.
- **When:** now

### IOS-01 — iOS build happens on a Mac

- **Story:** When we ship iOS, someone builds the same web codebase on a Mac and installs on an iPhone.
- **In / out:** In: later store/TestFlight path. Out: pretending Windows can ship the iOS binary.
- **Acceptance:**
  - **Given** a Mac and an Apple developer account
  - **When** the iOS build is produced
  - **Then** cold launch matches S0–S2 copy; APP-02–APP-05 have iPhone counterparts. Until then, no iOS ticket disguised as slice work.
- **When:** later MVP

### IOS-02 — iPhone is still one thumb, portrait

- **Story:** iOS does not grow a walkable office or a hammer because the platform is “premium.”
- **In / out:** Same product rules as Android. Same 9:16 cover. Out: 3D orbit “because iOS”; a Pro Max restage.
- **Acceptance:** Repeat APP-02 (iPhone proxies **C, D, F, H, J**), APP-03, S3-06, S4-01 on an iPhone. Fail if pinch-zoom ships “for iOS only.” Fail if 440×956 gets a different office than 390×844.
- **When:** later MVP

---

# Epic 9 — Later situations (gated)

Same machine, different irritation. Not this playtest.

### SIT-01 — Burnt Toast Morning

- **Story:** After Printer retry **and** testers both spill and personally smash in frame, a kitchen round exists: toaster as annoyance, different gravity layout, ~8–10 objects, ≥4 distinct fuses, Finger, punchline (alarm and/or fridge).
- **In / out:** In: later MVP situation 2. Out: kitchen as a graphics program; building it to avoid restaging the office; title `SUNDAY BREAKFAST` / `The toaster is already lying.` only when it ships.
- **Acceptance:**
  - **Given** gate passed (playtest notes: spill + extra smash in office)
  - **When** kitchen loads
  - **Then** two-second read is the toaster; first chain in first kitchen session; rail from office may say `Kitchen’s worse →` only after office has punched once. Do not art the kitchen before the gate.
- **When:** later MVP (gated)

### SIT-02 — Unexpected Item (checkout)

- **Story:** Situation 3 is a portrait lane: scanner / bagging as annoyance, soda pyramid punchline, queue-rage without a traffic jam.
- **In / out:** In: after kitchen or after constraint-on-office if budget pinches kitchen. Out: traffic jam, parking lot, city.
- **Acceptance:**
  - **Given** gate + kitchen (or explicit product skip of kitchen)
  - **When** checkout loads
  - **Then** stranger can read `UNEXPECTED ITEM` in-world; Hands off the scanner is a later constraint on that space, not a reason to add a hammer.
- **When:** later MVP (gated)

### SIT-03 — Lock: no fourth situation, no second office

- **Story:** We do not add a fourth situation or a second office room until the Printer session is proven.
- **In / out:** In: this lock. Out: warehouse of rooms; “just one more desk.”
- **Acceptance:**
  - **Given** current backlog
  - **When** someone files kitchen, checkout, or a new office before the gate
  - **Then** the ticket is refused until playtests show: retry on Printer, visible spill (OF-A-01), personal smash in frame (VENT-04/08).
- **When:** now (the lock) / later (the content)

**S9 rail** (`Kitchen’s worse →`) is later chrome, not slice-now. Office remains replayable forever via AGAIN.

---

# Epic 10 — Not stories (kill list)

Do **not** file these as stories. If a ticket smells like one, close it.

| ID | Not a story | Why |
| --- | --- | --- |
| KILL-01 | Hammer, wrecking ball, giant fist, laser, magnet, tornado, paint, balloon, gadget finger | Extra damage is the Finger. Weak vent → restage mass/foley. |
| KILL-02 | Tool tray / loadout / shop / coins / upgrades | Smash-upgrade competitor. |
| KILL-03 | Walkable 3D office, orbit camera, pinch-zoom, hallway, second desk | Cover game, not exploration. |
| KILL-04 | Photoreal printer / prettier SKU as the milestone | Copier is the joke. Cup visible ≠ slice done. |
| KILL-05 | Kitchen or checkout as a graphics demo before the Printer gate | Locked. |
| KILL-06 | Fourth situation; traffic jam; city; “wreck the whole space” as the goal | Different product’s budget. |
| KILL-07 | Tutorial lecture, three-screen comic, ghost that plays the chain, “tap the cup” | Scene acting only. |
| KILL-08 | RESET ROOM as play HUD | Rage-room chrome. CARD-07. |
| KILL-09 | Cup-as-button (script while mug sits) | Juice hiding no spill. OF-A-01. |
| KILL-10 | Cover that hides vents to save the cup | Illegal trade. S3-04. |
| KILL-11 | Camera follow of flying paper as subject | Follow the link. VENT-03. |
| KILL-12 | Leftover smash as win / “smash the rest” checklist | Live wreck in; cleanup mode out. |
| KILL-13 | Counting broken objects as the only score; six-axis mood-board meters | Four joke stats only. |
| KILL-14 | Combo badges, NICE, CHAOS popups during chain | Chrome gone. |
| KILL-15 | Interrupting a chain with banners, ads, IAP; paywalling a joke, fuse, or extra hit | Never. |
| KILL-16 | Stamina, lives, come back later | Retry is curiosity. |
| KILL-17 | Daily revenge / streaks / calendar in the slice | Habit layer later, not a screen. |
| KILL-18 | Home, shop, daily, loadout pages | UX: if you need more pages, fantasy is leaking. |
| KILL-19 | People, ragdoll coworkers, PC minigame, login puzzle | Not this room. |
| KILL-20 | 11th object (stapler, mug tree, smashable monitor) | Cap 10. PC is paint. |
| KILL-21 | Peek chevron; teaching peek to find the cup or plant | Restage. |
| KILL-22 | One poke / Hands off / rubber band as the **first** session | Pile on is the slice. |
| KILL-23 | CLIP (SOON); sharing the stats card as the clip | Omit CLIP or export the chain. |
| KILL-24 | iOS work on Windows; landscape restage / dual-mode / iPad cinema / landscape store art; unique layout per SKU; iPad 3:4 first-class; Fold tablet mode | APP / IOS split. Portrait 9:16 cover is locked. Test A–F, do not restage. |
| KILL-25 | Leaderboards, accounts, live events, narrative campaign | Out of MVP. |
| KILL-26 | “Make it feel juicy” without an observable Then | Not a story. Juice is foley, haptic, readable events. |

---

## Playtest script (must-pass set, in order)

Use a first-time Android tester, sound on, one thumb, no lecture. TEST panel allowed for **repro** after they play; first pass is thumbs only.

1. Cold launch → **S0-01 / S1-01 / S2-01** (wordmark, Sunday title, `Poke it. Then pile on.`).
2. Pause ~2s → **S3-01 / S3-04** (point at printer; circle vents + jam tongue + fan + lamp).
3. Confirm **S4-03** (no ghost finger).
4. Poke the cup → **OF-A-01** (mug dumps) then **OF-A-02** (wet mid, 3+ events).
5. During or after, poke the plant → **VENT-04**; watch that the lens stayed on the chain → **VENT-03**.
6. Copier LCD → **PL-01**; still hittable → **PL-03**.
7. Read the strip aloud → CARD-01 (not must-pass id but cheap). Tap AGAIN → **CARD-07**.
8. Optional second try: “start with the lamp” or “hit the plant harder.”

Gate for kitchen: this script’s spill **and** in-frame personal smash both happened, and they retried without a stamina story.
