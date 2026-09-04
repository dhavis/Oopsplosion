# Oopsplosion --- MVP PRD

Status: MVP spec. Source brief: `docs/concept.md` (starting point, not law). Extra-damage / rage-relief authorship added 28 Aug 2026.
Product name: **Oopsplosion**. Do not rebrand to "MAKE IT WORSE" or "Not My Problem". Those are pitch lines.

## One-sentence pitch

Light a chain, then pile on. The spiral was not your fault. The extra hits were.

## Player and platform

- **Player:** adult phone user who already knows rage-room games exist and finds "tap to break a glass" thin. They want a crazier spiral **and** the first-hand vent of actually hitting something.
- **Platform:** mobile first. **Capacitor webview**, not a Unity/React rewrite. **Portrait only. One authored cover: 9:16.** **Controls are one thumb.** If a round needs two hands, it is out of spec. If they rotate, lock portrait or pillarbox the **same** 9:16 cover — letterbox-if-rotate is crash-prevention, not a second mode. Never restage. Never dual-mode toggle.
- **Session:** about 1-5 minutes including retries. A single round is 20-90 seconds of play plus an end card.
- **Not the player:** someone who wants to walk a 3D warehouse and grind upgrades.

**Assumption:** target is iOS/Android; first proof can be a vertical-slice build on one OS. Layout is **logical CSS pixels** (`window.innerWidth` / visual viewport), not panel resolution. Physical pixels are for asset sharpness (typical DPR 2–3), not a second layout.

### Portrait cover vs the phones people actually hold

Top-10 iOS and top-10 Android SKUs are **design/test devices**, not 20 rooms. One 9:16 cover must survive the cluster. Do not invent a layout per SKU.

**Locked cluster (logical CSS px, portrait):** short edge **~360–430**, long edge **~780–956**, aspect **~19.5:9 through ~20:9** (iPhone ~19.5:9). Author at 9:16. Taller phones get extra letterbox **inside** the existing safe areas (top 12% / bottom 18% thumb) — not a restage, not a second composition.

**How the extra height is spent:** the readable cover stays the middle ~70%. Notch / Dynamic Island / punch-hole eat the top band. The thumb parks in the bottom band. Essential silhouettes (printer blink, cup, copier sliver, AGAIN) never live in those bands. A 20:9 360×800 and a 19.5:9 360×780 show the **same office**; the 20:9 phone just has more empty air in the already-reserved gutters.

**IN**

- One 9:16 authored cover for all phones in the cluster.
- Safe-area survival on 19.5:9 and 20:9.
- Rotate = lock or pillarbox that same cover.
- iPad (if it appears): pillarbox the 9:16 cover. Not a 3:4 restage.
- Fold (if a unit shows up): **cover-screen / inner portrait phone pane only**, same 9:16 cover. Not a tablet mode.

**OUT**

- Unique layout per SKU.
- Landscape as a product orientation; landscape restage; dual-mode toggle; landscape store art; iPad cinema.
- iPad 3:4 as a first-class layout.
- Fold-unfold dual cover. **Assumption (Q2 2026):** no fold is in the global top 10 *as a phone* (Counterpoint: Apple + Samsung candybars only). Do not build a Fold inner. If a Flip/Fold arrives in playtest, treat it as a tall phone pane, extra letterbox, same cover.
- Designing for 4.7" SE (375×667) or Pixel Pro XL (448×998) as unique layouts. If they appear, same 9:16 cover; SE is almost native 9:16; XL gets more gutter. Not canonical QA.

**Canonical test list** (QA must name these viewports; Chrome device mode is legal for layout DoD; a real APK still required for APP-01). Proxies, not 20 unique covers. CSS pixels, portrait.

Must-pass (six viewports cover the cluster):

| ID | CSS px | Aspect | Proxy (why it is in the list) |
| --- | --- | --- | --- |
| A | 360×780 | ~19.5:9 | Galaxy S24 / S25 / **S26** — volume Android, Counterpoint Q2 2026 |
| B | 360×800 | 20:9 | Galaxy **A07** HD+ (720×1600 @ DPR 2) — global volume candybar |
| C | 390×844 | ~19.5:9 | iPhone 12–14 / **16e / 17e** — largest single iPhone viewport (DeviceAtlas May 2026) |
| D | 393×852 | ~19.5:9 | iPhone **15 / 16** |
| E | 412×915 | ~20:9 | Pixel 8/9/10, Galaxy **A17**, Moto G — large Android / 412-class |
| F | 430×932 | ~19.5:9 | iPhone Plus / 15 Pro Max |

Cluster-edge soak (same cover; fail only if cup, blink, copier sliver, or AGAIN is eaten):

| ID | CSS px | Aspect | Proxy |
| --- | --- | --- | --- |
| G | 384×832 | ~19.5:9 | Galaxy Ultra FHD+ default (S24/S25/S26 Ultra) |
| H | 402×874 | ~19.5:9 | iPhone **16 Pro / 17 / 17 Pro** — current best-seller class |
| I | 414×896 | ~19.5:9 | iPhone 11 / XR — still huge installed base |
| J | 440×956 | ~19.5:9 | iPhone **16 / 17 Pro Max** — wide edge of the cluster (440 is 10px past 430; still this cover, not a Max layout) |

Sources for the proxies, not a shopping list: Counterpoint global handset top 10 Q2 2026 (iPhone 17 / 17 Pro Max / 17 Pro / S26 Ultra / A07 / A17 / 17e / S26 / iPhone 16); DeviceAtlas May 2026 installed-base viewports. iPhone 17 Air (420×912) sits inside the cluster; do not give it a unique cover.

**QA pass:** S3 two-second printer, S3-04 objects in the no-drag frame, and AGAIN in the thumb zone, on **A–F**. G–J are the same bar. "Looks fine on my monitor" is not a pass.

## Positioning vs competitors

Sell **two satisfactions in one round:** creating a spiral, and dealing damage first-hand as rage relief.

The chain is **"not my fault."** The extra hits are **"I did that."** Do not ship one without the other.

| They are | They sell | Oopsplosion is |
| --- | --- | --- |
| Classic rage rooms (Pocket Rage Room and copies) | A room + objects + smash | An irritation + a fuse + a spiral + first-hand vent |
| Smash-upgrade loops | Coins, bigger tools, longer smash | No shop. One verb. Extra hits are the Finger, not a hammer. |
| Heavy destruction sandboxes | Long sessions, systemic wreckage | Three authored situations, deep chains, smash-on-top |
| Combo + daily smash | Streaks, daily quota, smash-more | Daily revenge is a later habit layer, not the core |

Differentiation test (say this in a store sentence): *You get a jammed printer, one poke that starts a spiral, and you can still pile on.*

If a trailer is only a hammer montage, the trailer is wrong. If a trailer is only a hands-off Rube Goldberg with no first-hand hit, the trailer is also wrong. Show the coffee lighting the copier **and** the player knocking the plant because they needed that.

## Core fantasy

An everyday irritation becomes a physics cartoon. The first touch feels like the player's idea. Then the world goes past what they planned. They can also hit things themselves --- extra damage that juices as theirs: impact, authorship, **"I did that."** Slow motion on the good chain link. A score that jokes about how badly it went.

The chain is the joke. First-hand damage is the rage relief. Destruction is juice for both. Do not collapse either layer into the other.

## Core loop (observable player behavior)

A round has a **goal**, a **constraint**, and a **verdict**. If any of those is missing, it is not a round.

On every round the player:

1. **Sees a still scene** and can name the irritation in two seconds (no voiceover, no tutorial overlay). Evidence: if you pause at t=2s, a stranger points at the printer / toaster / scanner.
2. **Reads the constraint in one glance.** On-screen, six words or fewer. Slice example: `Poke it. Then pile on.`
3. **Chooses a fuse** --- first contact is one object (or one rubber-band shot), not a checklist of smashables. That first contact can start a chain.
4. **May keep hitting** (default). Extra taps poke/flick other objects. Those hits are first-hand rage relief. They juice as the player's. They do not steal the camera from an active chain. **Exception:** under **One poke**, further touches do nothing.
5. **Watches the chain** of at least three linked events when they picked a working fuse. They are allowed to pile on during it. They are not required to. Chrome stays gone.
6. **Gets a punchline beat** when the chain is good: freeze / slow-mo on the longest link, then the authored punchline object fires. The wreck then **stays live** so they can keep venting.
7. **Gets a verdict** on an end card: four joke stats + one line. Wreck around the card stays hittable until **Retry**. No wait, no spend, no "come back tomorrow".
8. **Retries the same situation** to light a different fuse they already saw, or to land a meaner extra hit.

Retry reason we want (player quotes): "I want to start with the lamp." / "I want to hit the plant myself."
Retry reason we kill: "I'm out of stamina." / leftover smash as the *only* reason, with no chain curiosity.

**Locked (was open in the concept):** extra hits happen **during the chain and after it**, until Retry. Camera still follows the chain. Extra smash does not get its own cinebot.

## Gameability scores (1-5)

Bar: fail the idea if it is only "here is a room, break stuff." Also fail if it is only "light a fuse and sit on your hands." Scores are for this PRD's MVP.

| Axis | Score | Why |
| --- | ---: | --- |
| **Goal** | 4 | "Win" means: under the stated constraint, light a chain that involves the named annoyance and fires the punchline. First-hand damage is a second, graded satisfaction (`I DID THAT`), not the win by itself. Soft miss is still a verdict. |
| **Choice** | 4 | 4-6 viable fuses, plus which extra objects to hit. First tap is still a fuse decision. Extra hits are rage relief, not a smash checklist that scores the round. |
| **Feedback** | 4 | Player can point at the slow-mo link (chain) and at a thing they personally broke (`I DID THAT`). CHAOS vs SATISFACTION still split mess from joke. First-hand hits must not inflate CHAOS. |
| **Retry** | 4 | Same situation, new fuse *or* a meaner extra hit, visibly different. Instant. Not a 5 until four fuses differ *and* extra hits feel authored. |
| **Session** | 5 | One thumb, 1-5 minutes, chain fits a 12-second clip. Extra smash is the same thumb, same scene. |
| **Cost** | 4 | Three situations, two tools, three constraints. Authored triggers, not a city. Extra hits reuse the same object set. Not a 5: chains still cost art + tuning. |
| **Hook** | 4 | "Destroy this office with ONE poke" is still the clip. First-hand vent is the in-hand feeling. Hook dies if we show a wrecking ball. |

## MVP contents

Prove **both** fantasies with **few authored situations and deep chains**, not a warehouse of rooms. Extra damage uses the same objects. It does not justify a second content set.

### 3 situations

Each situation ships with: a named annoyance, a punchline object, 8-10 interactive objects, >=4 distinct fuses, objects that are also legal first-hand smash targets, one still "calm" composition that reads in two seconds.

**1. Jammed Printer** (office, Sunday)

- **Readable irritation:** printer error light, paper hanging out of the jam, "PC frozen" in the background.
- **Named annoyance:** the printer.
- **Punchline:** the copier that will not stop, or the printer LCD flipping to something like `PRINTING 1 OF 847`.
- **Object set (cap):** coffee cup, paper stack, fan, hanging lamp, wobbly chair, ringing phone, plant (bystander), copier, printer, maybe a mug tree / bag. Stop at ~10.
- **Example fuses (must actually differ in play):** coffee into printer; yank the paper jam into the fan; lamp into chair into copier; phone vibration walks into the coffee. If two of these produce the same sequence, one of them is unfinished.
- **First-hand vent (must feel authored):** plant, mug/bag, phone, chair --- objects the player can poke/flick themselves and know they broke. These can also be fuses. They must juice on a direct hit even when they are not lighting a chain.

**2. Burnt Toast Morning** (kitchen)

- **Readable irritation:** toaster smoking, toast stuck, kettle on, fridge ajar.
- **Named annoyance:** the toaster.
- **Punchline:** smoke alarm and/or the fridge disgorging its contents.
- **Why it exists:** different layout (counters, gravity down cabinets) so we are not reskinning the office. Shareable clip type: kitchen spiral.
- **Object cap:** ~8-10. Include one bystander (cat, or a phone on the counter). Do not build a full house.
- **First-hand vent:** dishes, kettle, leaning pan --- smashable without being the only joke.

**3. Unexpected Item** (self-checkout)

- **Readable irritation:** `UNEXPECTED ITEM IN BAGGING AREA`, scanner screaming, soda pyramid in frame.
- **Named annoyance:** the scanner / bagging scale.
- **Punchline:** soda pyramid collapse and/or the "ASSISTANCE" light starting a cascade (coupon printer, cart, next lane).
- **Why it exists:** queue-rage fantasy from the brief **without** a traffic jam. Traffic jam is a different product's budget.
- **Object cap:** ~8-10.
- **First-hand vent:** soda bottles, cart, coupon printer --- legal to hit; scanner deny still applies under Hands off.

Do not add a fourth situation until Printer retry is proven in playtests **and** testers both light a chain and personally smash something.

### Tools (2)

| Tool | Player does | When it exists |
| --- | --- | --- |
| **The Finger** | Tap = poke. Short swipe = flick. Extra contacts are legal except under **One poke**. | Always. This is the game. Fuse *and* rage relief. |
| **One rubber band** | Drag aim, release once. Misses are allowed. No second shot. | Only on the **One rubber band** constraint (later; not in the first three). Not a loadout. Not unlockable. |

No hammer. No wrecking ball. No laser. No magnet. No tornado. No giant fist. Extra damage is the same Finger, not a toy chest. If first-hand vent feels weak, restage mass and juice --- do not add a hammer.

### Constraints (3)

Shown as the round's rule. One per round. Same situation is replayable under a different constraint.

| Constraint | Observable rule | What it is for |
| --- | --- | --- |
| **Pile on** | Finger. Extra contacts poke/flick other objects. Chains still fire from fuses. | **Core game. Vertical slice.** Spiral + rage relief. |
| **One poke** | Player may make exactly one finger contact with one object. Further touches do nothing. | Puzzle. Proves the chain still works when vent is taken away. |
| **Hands off the annoyance** | Tapping the named annoyance does nothing (or a joke deny: it beeps, no chain). Extra hits on *other* objects are legal. Fuse must start elsewhere. | Forces "find a fuse," kills "just smash the printer," keeps first-hand vent. |

**Not MVP constraints:** 30-second timer as the puzzle, "no hands," "do not touch anything," "only 3 objects" as a separate mode. **One rubber band** is a later constraint on these same spaces, not the slice.

**Round math:** 3 situations x 3 constraints = 9 rounds from three authored spaces. That is MVP content, not a live-ops calendar.

### Vertical slice (ship this before the other two situations)

- Situation: **Jammed Printer**
- Constraint: **Pile on**
- >=4 working fuses
- Extra hits legal during and after the chain; they juice as **"I did that"**
- Punchline beat + live wreck (vent) + end card + instant retry
- First-session on-ramp: coffee cup is visually loud (steam, wet ring, sits where a spill will hit the printer). No lecture. If they poke the coffee, they get a chain on attempt one. If they then knock the plant, that hit is theirs.

If this slice does not produce a first chain in the first session, **stop**. If it produces a chain but testers never land an extra hit they can point at, the rage-relief layer failed --- restage juice and targets, do not add a hammer. Do not art up the kitchen.

## Scoring

Do not score "how many things you broke" as the *win*. Do not ship Damage / Precision / Combo / Chaos / Escalation / Satisfaction as six meters. That is a mood board.

Four player-visible stats on the end card. They can look like jokes. They must still map to what happened. Extra damage must not disappear into the chain's numbers.

### CHAOS

- **Shown as:** a percentage that may exceed 100% (e.g. `CHAOS: 97%`).
- **Player-visible meaning:** how out of control the *chain* got --- objects the player never touched that still moved or fired, and how long the longest link run was.
- **Goes up when:** the fuse branches (fan blows paper *and* the lamp starts swinging), more authored events fire in sequence.
- **Does not go up when:** the player smashes extra objects by hand. First-hand vent is `I DID THAT`, not CHAOS. Do not reward a loud mess with no links.
- **Observable test:** two runs, same situation. The longer chain gets higher CHAOS. A player who only personally smashes the plant has low CHAOS and a non-zero `I DID THAT`.

### SATISFACTION

- **Shown as:** a percentage that may exceed 100% (e.g. `SATISFACTION: 112%`).
- **Player-visible meaning:** did the spiral hit the *joke*, not just the noise --- and did first-hand hits *feel* like hits (juice), without letting smash-more beat a real punchline.
- **Goes up when:** the named annoyance is in the chain; the punchline object fires; the slow-mo beat ran on a chain of 4+ events.
- **Stays low when:** lots of stuff moved but the copier never went berserk / the toast never triggered the alarm. That split is the teacher: **high CHAOS + low SATISFACTION = a mess, not a spiral.** High `I DID THAT` + low SATISFACTION = they vented, they missed the joke.
- **Does not go up just because** they smashed more leftover objects. Rage relief has its own stat.
- **Observable test:** a player who only knocks the plant over cannot beat the SATISFACTION of a player who lights printer -> paper -> fan -> copier.

### THINGS THAT DEFINITELY WEREN'T YOUR FAULT

- **Shown as:** an integer (e.g. `43` is a joke target, not a requirement).
- **Player-visible meaning:** count of objects wrecked or triggered that the player never touched, with extra weight for tagged **bystanders** (plant if the *chain* knocked it, coworker's lunch, cat, stranger's cart, the other lane).
- **Goes up when:** play is indirect. This is the chain, numbered.
- **Does not count:** objects the player poked / flicked / band-shot themselves. Those belong to `I DID THAT`.
- **Observable test:** a coffee fuse that wrecks seven untouched objects must outscore a poke that only jostles two neighbors. If the player then personally knocks the plant, FAULT does not steal that plant --- `I DID THAT` does.

### I DID THAT

- **Shown as:** an integer (e.g. `12`).
- **Player-visible meaning:** objects the player personally wrecked or knocked with **extra** Finger contacts after the fuse (and any extra contacts before a chain starts, if they smash something that does not chain). The fuse object itself is "that was my idea," not this number --- do not double-count it here.
- **Goes up when:** they pile on. Direct hit, their thumb, their wreckage.
- **Does not count:** chain-moved objects they never touched. The paper the fan blew is FAULT, not this.
- **Under One poke:** this stat stays `0`. That is the joke of that constraint.
- **Observable test:** two runs, same coffee fuse. The run where they also flick the plant and the mug must show a higher `I DID THAT`. CHAOS and FAULT stay in the same band if the chain was the same.

### Verdict lines (end card)

Pick one. Primary CTA is **Retry**. Secondary can be **Next constraint** or **Next situation** once those exist.

| Condition (observable) | Line |
| --- | --- |
| Punchline fired **and** chain length >= 4 | `THAT ESCALATED QUICKLY.` |
| Punchline fired **and** `I DID THAT` >= 3 | `THE PRINTER STARTED IT.` (office) / keep situation variants |
| Chain length 2-3, punchline missed, `I DID THAT` >= 3 | `YOU NEEDED THAT.` |
| Chain length 2-3, punchline missed, low extra hits | `THAT WAS JUST A MESS.` |
| Chain length <= 1, extra hits happened | `YOU JUST HIT THINGS.` |
| Chain length <= 1, no extra hits | `YOU JUST POKED IT.` |

No fail-lock. No stars-as-stamina. Never interrupt a chain with UI (banners, ads, score popups). Extra smash during a chain is not UI --- it is physics.

**Assumption:** chain length = count of authored events that fired because of a prior event, not because of an extra tap. Extra taps can *start* a new branch if they hit a wired object; that branch counts as chain if it links. A dead-end smash is `I DID THAT` only.

## Success metrics (vertical slice)

Use on the Printer + **Pile on** slice, with first-time players, no spoken tutorial. If we miss the chain metrics, we do not expand content. If we miss the first-hand metrics, we do not pretend rage relief shipped.

| Metric | Target | What we are proving |
| --- | --- | --- |
| First chain | >=70% of testers produce a **3+ event chain** on this situation within the **first 2 minutes** | First chain in the first session, no lecture |
| Time to first chain | Median **< 45s** from situation load | Coffee fuse is actually obvious |
| First-hand hit | >=70% personally wreck **at least one extra object** they can point at within the first 2 minutes | Rage relief shipped, not just spectatorship |
| They can tell | >=80% can point at one thing the *chain* broke and one thing *they* broke | Dual authorship is readable |
| Retry without prompt | Median **>= 2 extra attempts** on the same situation before they say they are done | Curiosity, not a gate |
| Why they retried | Majority cite **a different fuse / a meaner extra hit they saw**, not stamina | Mastery / vent, not a chore |
| What the game is | When asked, they mention **both** a chain/spiral/not-my-fault **and** hitting/venting/I-did-that. Fail if they only say "rage room" with no chain. Fail if they only say "watch the copier" with no vent. | Dual positioning landed |
| Clip | >=40% would send their **best chain** to a friend (yes/no) | Hook is still the chain |
| Control | 100% can complete a round with **one thumb**; zero testers need a second hand | Mobile bar |
| Session | Typical sit-down including retries fits **1-5 minutes** | Session bar |
| Goal clarity | >=80% can state the constraint in their own words after one round | `Poke it. Then pile on.` was readable |

Do not use DAU, retention, or revenue as vertical-slice success. Those are the wrong timescale.

## Kill list

If it smells like a generic rage room **with no spiral**, it is out. If it smells like a hands-off cartoon **with no vent**, it is also out.

- Tool warehouse (hammer, wrecking ball, giant fist, paint, balloon, laser, magnet, tornado, gadget finger)
- Coin / upgrade / bigger-smash loop
- Warehouse of rooms; traffic jam / city block as MVP content
- Counting broken objects as the *only* win
- Six-axis scoreboard from the brief
- Timer-as-the-puzzle
- "No hands" / "do not touch anything" as ship constraints
- Tutorial lecture, three-screen comic, ghost that plays the chain
- Leftover smash as the **win condition** or a post-chain cleanup *mode* with a checklist. Live wreck you can still hit is in. A "break the rest" objective is out.
- Interrupting the chain with banners, ads, or IAP
- Paywalling a punchline, a joke line, a fuse, or extra hits
- Stamina / lives / "come back in 20 minutes"
- Daily revenge as the thing you build first
- Extra taps that jiggle nothing (except under **One poke**, where that *is* the rule)
- A smash HUD during the chain (combo badges, CHAOS+12, "NICE")

## Risks

- **Physics looks cheap on a phone.** If the show is debris quality, rage rooms with better smash win. Mitigate: readable *events* (paper hits fan, fan hits lamp), not particle density. First-hand hits need mass and foley, not more meshes.
- **Juice hides no choice.** Slow-mo on a two-object bump teaches that any mess is a win. Mitigate: punchline beat only on chain >= 4; SATISFACTION stays low otherwise.
- **Smash-more eats the watch moment.** Extra hits during the chain steal the joke. Mitigate: camera follows the chain, not the extra smash; no HUD on extra hits; punchline still plays.
- **Fuses are not distinct.** Retry dies. Mitigate: situation is not done until four fuses show different mids.
- **Authored content cost.** Chains *are* the game. Mitigate: three situations, reuse constraint matrix; extra damage reuses the same objects.
- **Pile on feels empty** because extra objects have no mass/juice. Then someone will add a hammer. That is how the product dies the other way. Mitigate: at least three objects with a satisfying direct hit in the slice (plant, mug, chair).
- **Goal still unread.** Players smash the printer and never light a chain, or they poke once and sit on their hands. Mitigate: title + constraint always visible; coffee is loud; extra objects look hittable without looking like a hammer room.

## Open decisions

Mark these; do not silently pick in code.

1. **Portrait vs landscape.** **Locked:** portrait only. Authored cover **9:16**. Survive **~19.5:9–20:9** via safe areas (top 12% / bottom 18% thumb). Logical CSS cluster: short **~360–430**, long **~780–956**. Canonical test list in Platform above. Letterbox-if-rotate is crash-prevention, not a second mode. Never restage. Never dual-mode. iPad cinema / landscape store art / per-SKU layout / Fold tablet mode are out of slice.
2. **Camera:** side dollhouse vs 3/4 vs real 3D. Recommendation: not walkable 3D.
3. **Extra taps during the chain:** **Locked for this PRD:** they smash. Camera stays on the chain. Under One poke they do nothing.
4. **Fail vs grade.** This PRD: grade. Revisit only if testers do not understand the goal.
5. **Punchline: one per situation, or per-fuse variants?** Recommendation: one shared punchline plus at most one variant so Cost stays sane.
6. **First-fuse highlight:** steam/spill only vs a one-time finger hint. Recommendation: scene acting, not UI.
7. **Later tools:** never, vs one new tool *as a named constraint* per new situation. Never a shop. Rubber band is the first candidate for that later slot.
8. **End-card voice:** one line of VO vs text only. Do not block the slice on VO.
9. **What "one more situation" is after Printer:** Kitchen, or Printer + **One poke** first. Test constraint-on-same-space before building space three if budget pinches.
10. **End card vs live wreck.** Recommendation: dim-strip overlay, wreck around it stays hittable until Retry. Do not freeze the world into an unhittable postcard while they still want to vent.

## Explicitly OUT of MVP

- Daily revenge / daily challenges / streak calendar (retention layer later, not core)
- All monetization: IAP, ads, battle pass, cosmetic shop. **Never paywall the joke. Never interrupt a chain.** If we must say it: monetization is OUT.
- Stamina, energy, timed lives
- Tool shop, upgrades, coins, hammers
- Landscape restage, dual-mode orientation toggle, iPad cinema / landscape store art
- Unique layout per SKU; iPad 3:4 as a first-class layout (pillarbox 9:16 if it appears)
- Fold-unfold dual cover / inner tablet mode (cover-screen or inner *portrait phone pane* only, same 9:16 cover)
- Traffic jam, parking lot, city, "wreck the whole space" as the *goal*
- More than three situations
- More than two tools
- Leaderboards / global longest-chain (a local "best on this situation" on the end card is allowed)
- Accounts, social graph, live events
- Narrative campaign, characters to unlock
- Heavy destruction sandbox / Teardown-class sim
- Voice-acted story, tutorial levels that are not the Printer
- "No hands" / wait-and-see rounds as the default (One poke is the wait-and-see *constraint*, not the slice)
- Any feature whose job is to make leftover smash the *win* instead of a funnier fuse **or** a meaner extra hit

---

**MVP is done when:** a stranger, one thumb, no lecture, lights a Printer chain in the first session, personally breaks something they can point at, reads the four joke stats, and retries because they saw the lamp --- or because they wanted to hit the plant harder.
