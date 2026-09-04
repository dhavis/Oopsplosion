# Product evaluation — Oopsplosion

**Scope:** Jammed Printer + Pile on, after the playability-break fix. Player said the game was not working: items not in the visual space, coffee cup missing. Root cause (fixed): cup sat on a tray collider that *was* the printer, so spawn contact was `cup→printer`, the coffee script auto-started, camera chased paper, the cup left the frame.

Evidence for this pass: `room3d.png` (calm still, portrait, 1.5s, 0 chain events, 0 papers) and `room3d-poke.png` (900ms after `poke("cup")`, events `["cup>printer"]`, 5 papers coughing). Source: `docs/concept.md`, `docs/prd.md`, `docs/office.md`, `docs/office-ux.md`, `src/scale.ts`, `src/world.ts`, `src/game.ts`, `src/chain.ts`.

**Assumption:** the stills are `?test` skip-to-play frames, so title / constraint chrome is not in the shots. A real session still has those phases in code. The play surface in the shots *is* what the thumb lives on.

## Verdict

**Still reshape. Do not ship the slice. Do not kill 3D. Do not add a room.**

The hard stop is lifted: the cup is in the cover, the still is calm, poke-the-cup starts a printer chain on attempt one. That was the previous product failure, and it is fixed as a *cover* problem.

It is not a first **session**. A session is a round: goal, constraint, choice, chain you authored, a vent you can still see, a verdict, a reason to retry. This build sells a printer product shot with a guilty mug. Poke the mug and a script coughs paper. The cup stays on the tray. That is a button, not a fuse. The original complaint was also *items* (plural) missing — we put the cup back by throwing the plant, phone, bag, readable fan, and jam tongue out of the sentence. First poke is now possible. First session is still a smash-adjacent close-up.

Ship-the-slice would mean a stranger, one thumb, no lecture, lights a *spiral they caused*, can point at something they hit themselves, and wants the lamp or the plant next. We have the mug and the cough. Stop there and this is Pocket Rage Room with a cutscene.

## Positioning

**What we sell:** a jammed printer, one poke that starts a spiral, then pile on.

**What this build sells:** a hero printer and a fat cup. Poke the cup, the machine barfs. Competitors already sell “tap the toy, debris happens.” We do not.

| They sell | This slice accidentally sells | We must sell |
| --- | --- | --- |
| Pocket Rage Room: a room + smash | A printer close-up + one smashable | Irritation + fuse + spiral + first-hand vent |
| Smash-upgrade: find the toy | Magnetized tap → coffee script | First touch is *their* idea among readable fuses |
| Hands-off Rube Goldberg | Mug sits, papers spawn, camera may wander | Spill you can see, then watch |

3D is still in. The cover is no longer an empty doorway. It overcorrected into a catalog shot of one appliance. That is a different way to not be Oopsplosion.

## Core loop

Paper loop (still correct):

1. See a still irritation in two seconds.
2. Read `Poke it. Then pile on.`
3. Choose a fuse. First-session: the cup.
4. Watch the chain. Pile on if you want.
5. Punchline on the copier. Wreck stays live.
6. Verdict. Retry because they saw the lamp — or wanted a meaner hit on the plant.

**Where it is a sandbox / a button, right now:**

- Step 1: irritation reads (LED, `PC LOAD LETTER`, printer box). Situation does not. Phone, plant, bag, jam-as-tongue, fan-as-fan are not in the two-second sentence. Chair is a fragment. Copier is a grey flank or a wheel on a pedestal, not a sleeping punchline.
- Step 2: play chrome is empty except **RESET ROOM**. That is rage-room language. Constraint copy exists in a phase the test still skipped; it does not live on the round.
- Step 3: the cup is the on-ramp. Pick also *prefers* the cup in a fat screen magnet. First touch is not a decision among 4–6 fuses. It is “the mug, or miss.”
- Step 4: `poke("cup")` at 900ms shows the cup still sitting, `ERR / WET`, five papers. The 450ms authored start fires the coffee script if you merely poked the cup. The player did not spill. They pressed play.
- Step 5–6: not in the evidence. Plant is off-cover, so pile-on has nothing obvious to hit. Retry bait (lamp as a *next fuse*, not a ceiling prop) is weak.

Destruction is juice. The cough is juice. Juice on a button is not a spiral.

## Gameability scores (1–5)

Scores are for **this 3D build**, not the PRD-on-paper. Previous cover-fail scores in parentheses.

| Axis | Now | Was | PRD | Why |
| --- | ---: | ---: | ---: | --- |
| **Goal** | **2** | 1 | 4 | Stranger can name the printer. “Win” is still not on screen. `RESET ROOM` teaches smash-and-reset. No persistent constraint. Soft. |
| **Choice** | **2** | 1 | 4 | Cup is visible and is the on-ramp. That is one choice, magnetized. Fuse B is a sheet against a wall, not a jam tongue. Fuse C is a lamp you might tap by accident. Fuse D (phone) is not in the still. Tap-the-mug is not 4–6 fuses. |
| **Feedback** | **3** | 2 | 4 | `ERR / WET` + coughing paper teaches *wet death*. The cup remaining on the tray teaches the *wrong* cause. Steam / wet ring still do not read as the dare. A chain they did not spill cannot be graded as theirs. |
| **Retry** | **2** | 1 | 4 | They saw paper. They did not see a funnier fuse already in the cover. Next try is “poke the mug again.” That is a GIF, not mastery. |
| **Session** | **4** | 2 | 5 | Portrait, one thumb, calm load, chain can run in seconds. Container is fine. The first 45s are no longer “where is the game.” They are “I poked the mug and a cutscene started.” |
| **Cost** | **4** | 3 | 4 | Still one authored room. Restage the cover and the spill, do not buy kitchen. Budget is no longer wasted on a doorway; it is wasted on a printer hero shot. |
| **Hook** | **3** | 1 | 4 | Wet printer coughing paper is a clip *if* the cup dumps into it. A mug that spectates its own cutscene is not “I did that / not my fault.” It is Office Space without the baseball bat — and without the spill. |

**Bar:** fail if it is only “here is a room, break stuff.” This is no longer an empty room. Fail if the on-ramp fuse is invisible: **pass.** Fail if first touch is tap-anywhere sandbox: **borderline fail** — tap-the-magnetized-mug is a sandbox with one toy. Fail if extra damage is leftover smash with no spiral: the spiral is a script; pile-on targets are off-stage. **Not ship.**

## Does the vertical slice now have a first session?

**On-ramp: yes. Session: no.**

Observable against the PRD first-session tests:

| Test | Now |
| --- | --- |
| Calm still at t≈2s, no chain, no papers | **Pass.** `room3d.png`. Spawn grace + unlabeled tray collider did their job. |
| Stranger points at the printer | **Pass.** LED + LCD + box own the frame. |
| Stranger points at the cup and believes it will go in | **Half.** Cup is fat, central, on a lip. Steam is not in the still. Wet ring is under the mug. The dare is “poke the ceramic,” not “that will spill.” |
| Poke coffee → chain on attempt one | **Pass as a script.** `cup>printer` + 5 papers at 900ms. **Fail as authorship.** Cup did not leave the tray. |
| 3+ event chain inside 2 minutes | **Likely** if they wait for queued beats (`paper>fan` at 1.8s, etc.). That is a timeline, not physics they caused. |
| Personally wreck one extra object they can point at | **Unproven / likely miss.** Plant, bag, phone are not in the cover. Chair is a sliver. Pile on has no stage. |
| Constraint readable | **Not on the play surface.** `RESET ROOM` is. |
| Retry because they saw the lamp / a meaner plant hit | **No bait in the still.** Lamp is set dressing. Plant is gone. |

The player’s report is half-fixed. Coffee cup: found. Items in the visual space: we hid them to save the cup. That trade is illegal. The cover’s job is printer + cup *and* quieter silhouettes for vent and retry. A mug close-up is how you fake an on-ramp.

## MVP

The vertical slice is still the right MVP test. Do not invent kitchen or checkout. Do not add a fourth fuse object. Prove **this** room.

Smallest remaining restage that proves a first *session* (product, not implementation):

1. **Keep** the calm camera, cup size cheat, separate tray, rest-contact ignore, spawn grace, printer-lip look-at, pick bias toward the cup *near the cup*. Those unblocked attempt one.
2. **Spill is the fuse.** If they poke the cup, the mug must tip toward the intake *before* `ERR / WET`. If the script can fire while the cup sits, the on-ramp is a button. Kill the 450ms “you touched it, play coffee” bypass as a product rule. Contact + motion can start the chain. A polite poke that leaves the mug upright is a slosh, not a spiral.
3. **Cover is a situation, not a SKU.** Printer + cup stay loud (~the working band). Lamp and fan readable as lamp and fan. Jam is a tongue out of the slot, not a sheet leaning on a wall. Copier stays a sliver. Plant, bag, phone, chair are quieter *in-frame* vents / retry bait. If the cup only fits by deleting the rest, the FOV is still wrong — cheat the heroes, do not crop the sentence.
4. **Then** prove attempt-one: poke coffee → visible dump → printer in the spiral → papers toward the fan. Then prove they can still hit the plant without hunting.

That is the whole slice. Depth of the 3D room is juice around that cover.

## Kill list

Anything that hides the fuse, or hides the rest of the round behind the fuse:

- **RESET ROOM** as play HUD. Rage-room chrome. Retry lives on the end card.
- **Cup-as-button:** 450ms auto-script after any cup poke, with the mug still seated. Juice hiding no spill.
- **Pick magnet so fat it steals jam / lamp / phone.** Sticky targeting on the cup is in. Eating the other fuses is out.
- **Camera follow of flying paper** as the look target. Follow the *link* (printer, fan, lamp, chair, copier). Paper is debris, not the subject. The last bug was this; the fallback in code still treats last paper as a follow.
- **Printer hero crop** that solves “missing cup” by deleting plant / phone / bag / jam tongue from the still.
- Fan that reads as a valve / wheel. Fuse B dies if the next victim is not a fan.
- Jam as a postcard against the wall. Fuse B is a pullable tongue.
- Tutorial finger, “tap the cup,” quest text.
- Pinch-zoom, orbit, peek-to-find-the-mug (or the plant).
- A hammer, an 11th object, a second steaming cup.
- Kitchen / checkout / a new room until Printer retry is proven *and* testers both spill and personally smash something in frame.
- Treating “cup is visible now” as slice-done.

## Risks

- **On-ramp theater.** We can pass “they poked the cup” in QA while the mug never moves. Testers will say the game works. They will mean a GIF played. Mitigate: attempt-one evidence is a still of the cup *off* the tray, then paper.
- **Juice hiding no choice.** Slow-mo and paper flock on a one-object script teaches that any poke is a win. Punchline beat still wants chain ≥ 4 *and* a spill they can point at.
- **Close-up cheapness.** Zooming to make the cup readable makes this a bad smash game with a mug. Cheat hero scale *inside* a situation cover, not a product shot.
- **Walkable 3D creep** is quieter now; **SKU creep** replaced it. Next request will be a prettier printer. Kill that. The copier is the joke.
- **Pile-on without a target.** Extra damage cannot save a missing plant. If they can only see printer + cup, they will mash the mug twice and we will call it vent.
- **Honest-scale religion** already lost (cup is cheated). Do not swing back to 8 cm. Do not cheat the cup so hard the printer looks like a toy it sits on — the still is already close to that.

## Next product questions

The team must decide these. Do not silently pick in code.

1. **Button vs spill.** May a cup poke start the coffee chain if the mug is still upright on the tray? Recommendation: **no.** The on-ramp is the accident. Script the *aftermath* after the dump reads.
2. **Cover contract.** Printer-SKU close-up vs situation cover with quieter vents in frame. Recommendation: situation cover. Cup stays loud; it does not get the whole page.
3. **How sticky is cup pick?** Fat-finger near the mug, yes. Whole working band is the mug, no. Recommendation: sticky in a thumb-radius around the cup; jam tongue and lamp remain tappable.
4. **Where do plant and phone live now that the camera is on the lip?** Recommendation: in the cover, quieter than the cup, still hittable without peek. Off-frame vents cannot prove `I DID THAT` or Fuse D.
5. **What is the jam in the still?** Recommendation: a hanging tongue from the slot, dry, pullable. A sheet on the cabinet is set dressing and Fuse B is unfinished.
6. **Play chrome.** `RESET ROOM` vs nothing vs the constraint as a six-word whisper. Recommendation: nothing during the chain. Retry on the card. Kill RESET ROOM.
7. **When is the slice shippable?** Recommendation: not when the cup is visible. When a stranger spills on attempt one, watches paper hit something that is *in the same still*, and can still knock the plant. Same room. No kitchen.
