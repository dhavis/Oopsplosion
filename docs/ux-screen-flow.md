# UX screen flow — Oopsplosion (vertical slice)

Portrait. One-handed. Fat-finger. Fewest screens that still prove: look at a calm scene, spot the fuse, start a chain, pile on with your own hits, laugh, try again.

Daily revenge is out of this flow. One later note at the bottom. Not a screen.

MVP situations, same machine: **office**, then **kitchen**, then **checkout**. First session is office only until one punchline exists **and** one first-hand hit has juiced. Traffic jam is out of the slice.

Dual feel, one thumb: the chain is **"not my fault."** Extra hits are **"I did that."** Chrome never explains that. Foley and haptics do.

---

## Screen list (ship these)

| ID | State | Is it a full screen? | Required in slice |
| --- | --- | --- | --- |
| S0 | Boot | Yes, 1.5s | Yes |
| S1 | Situation title | Overlay on calm, ~1.5s | Yes |
| S2 | Constraint / tool | Overlay on calm, one line | Yes |
| S3 | Calm inspect | The scene. This is the game. | Yes |
| S4 | Play (fuse + extra hits) | Same scene, gesture | Yes |
| S5 | Chain / chain peak | Same scene, chrome gone | Yes |
| S5b | Vent the wreck | Same scene, wreck live | Yes |
| S6 | Punchline card | Overlay on **live** wreck | Yes |
| S7 | Retry | Instant reload to S3 | Yes (action, not a page) |
| S8 | Share clip | System sheet from S6 | Yes only if chain export works |
| S9 | Next situation (rail) | One line under AGAIN after first punchline | Yes, after office has scored once |
| — | Home / shop / daily / loadout | — | **No** |

That is nine states, two overlays, one scene. If a build needs more pages, the fantasy is leaking. S5b is not a new location. It is the wreck staying hittable.

---

## First 60 seconds (beat-by-beat)

Assume a right or left thumb, phone in one hand, portrait, sound on.

**0.0–1.5s — S0 Boot**
- Black. Wordmark **OOPS-PLOSION** (logo may break as Oops-plosion). Under it, one line: **MAKE IT WORSE.**
- No “tap to start.” No legal wallpaper. If legal must exist, it is 8pt and ashamed.
- Thumb: rest.
- Haptic: none. Sound: a short dry sting, not an orchestra.

**1.5–3.0s — S1 Situation title**
- Hard cut into the office, already calm, already lit. No load spinner over the joke.
- Centered, over the scene, then out:
  - **SUNDAY AT THE OFFICE**
  - **The printer has opinions.**
- Thumb: rest. This is not a tap wall. If they tap, skip the rest of the title fade.

**3.0–5.0s — S2 Constraint**
- Title is gone. One line, lower third, above the thumb zone so it is readable, not under a finger:
  - **Poke it. Then pile on.**
- No rubber band. No tool tray. The Finger is the verb. The cup looks guilty. The plant looks hittable.
- Thumb: optional tap anywhere to dismiss faster. Otherwise it recedes on its own.

**5.0–18s — S3 Calm inspect**
- Printer blinks. Cup on the lip. Phone rings in the world. Copier waits. Lamp hangs. Chair wobbles if you look. Plant sits in the back, smashable, not the two-second read.
- No HUD. No score. No joystick. No tutorial finger.
- Thumb: rest, or a short vertical drag to peek the copier if it sits slightly below the fold. No pinch. No horizontal pan.
- Sound: office irritation, low. Haptic: none until a hit.

**18–26s — S4 Play**
- Player pokes or flicks the cup (obvious fuse) or another legal object.
- Fat target: the cup’s hit area is at least 56×56 dp, visually a cup, not a button.
- On contact: commit tick (haptic 1). Ceramic + slosh. Chain can start.
- Extra taps are legal. They smash what they hit. They do not open UI.
- Copy if they poke empty desk: **That helped.** Then still calm. No modal.

**26–46s — S5 Chain**
- **Everything chrome is gone.** Title, constraint, any peek chrome, any accessibility pause until they need it (see Accessibility).
- Camera follows cup → printer → paper → fan → lamp → chair → copier.
- Two or three slow-mo links. Screen shake only on those peaks. Foley carries the sentence.
- Thumb: **allowed.** Extra taps poke/flick other objects. Those hits are rage relief. They get haptic + foley as **"I did that."** They do **not** steal the camera. No combo badges. No score.

**46–60s — S5b Vent + S6 Punchline**
- Authored chain ends on the copier. Do **not** freeze the world into an unhittable postcard.
- Pull back so the office is a wreck they can still hit. Plant, mug, chair stay live.
- Dim-strip card slides over the wreck (S6), copier still visible in the gaps:
  - **THAT ESCALATED QUICKLY.**
  - CHAOS **97%**
  - SATISFACTION **112%**
  - THINGS THAT DEFINITELY WEREN'T YOUR FAULT **43**
  - I DID THAT **12**
  - **AGAIN** (primary) **CLIP** (secondary, only if export works)
- Taps on wreck still smash. Taps on AGAIN retry. Taps on CLIP share the *chain*.
- Thumb: smash or AGAIN. First-minute proof is this loop, not a map.

After the first punchline, a thin rail may appear under the buttons: **Kitchen’s worse →** It is a text link, not a carousel. Checkout waits behind kitchen. Player can ignore it and AGAIN the office forever. That is allowed.

---

## Every state

### S0 — Boot

**On screen**
```
OOPS-PLOSION
MAKE IT WORSE.
```

**Exact copy**
- Wordmark: `OOPS-PLOSION`
- Tag: `MAKE IT WORSE.`
- Do not use: Welcome, Let’s go, Tap to rage, Unleash the chaos.

**Thumb:** rest.

**Hidden:** everything else. No settings gear on boot.

**Camera / juice:** static. Optional 1-frame glitch into S1. No slow-mo.

**Duration:** 1.5s, hard cut. Skip if tapped.

---

### S1 — Situation title

Always an overlay on the live calm scene. Never a separate art card that hides the room.

**Office**
```
SUNDAY AT THE OFFICE
The printer has opinions.
```

**Checkout**
```
LANE 4
UNEXPECTED ITEM.
```

**Kitchen**
```
SUNDAY BREAKFAST
The toaster is already lying.
```

**Thumb:** rest, or tap to skip fade.

**Hidden:** score, buttons, tool tray.

**Camera:** locked on the readable frame of the situation.

**Sound:** situation bed starts under the title (printer stutter, scanner beep-loop, toaster click).

**Haptics:** none.

---

### S2 — Constraint / tool

One line. Then gone. The tool is the Finger, in the world, not in a dock. A rubber band is a later constraint, not the slice handshake.

**Office (slice — Pile on)**
```
Poke it. Then pile on.
```
Tool: The Finger. Extra contacts are legal. No picker.

**Checkout (later — Hands off the annoyance)**
```
Hands off the scanner. Pile on the rest.
```
Tool: The Finger. Legal fuses are environmental (frozen peas on the lip, coupon, soda bottle, cart). Extra hits on those are legal. The scanner beeps and does nothing.

**Kitchen (later — One poke)**
```
One poke. That's the whole budget.
```
Tool: The Finger. One contact. Further taps do nothing. Copy if they try: `You spent it.`

**Optional skip copy** (if they tap the line): none. The line just leaves.

**Thumb:** optional tap to dismiss. Not required.

**Do not show:** item counters, “3/3 objects,” a timer unless the constraint *is* a timer. Slice prefers physical limits over clocks.

If a timer must exist in a later situation, copy is the constraint itself:
```
30 seconds. Then it's their problem.
```
Clock is huge, calm-only, vanishes at the first hit.

---

### S3 — Calm inspect

This is the product. Treat it like a cover, not a menu.

**On screen**
- The situation, ordered, readable in two seconds.
- Fuse-scale props: one obvious (office cup, checkout frozen peas, kitchen dripping tap or leaning pan) plus two quieter legal fuses for retry.
- Vent-scale props: at least two objects that look personally smashable without competing with the two-second read (office: plant, mug; not a second steaming cup equal to the fuse).
- Safe area: top 12% and bottom 18% stay clear of essential silhouettes so notches and thumbs do not eat the joke.

**Copy:** none, after the constraint has receded. Irritation is in the scene (UNEXPECTED ITEM on the scanner LCD, printer LED, toaster smoke). Not in a quest log.

**Thumb:** rest. Short vertical drag to peek overflow. Lift to settle. Drag does not fling objects.

**Hidden:** HUD, pause (except a11y, see below), score, combo, stickers.

**Camera:** locked. Soft parallax only if it does not cost readability.

**Sound:** looped annoyance, low. Music pulse, quieter than foley.

**Haptics:** none.

**Fat-finger:** legal fuse *and* vent objects ≥ 56×56 dp hit. Visual size can be smaller if the halo of the object is honest (the cup looks grabable; the plant looks knockable). Illegal objects do not steal the tap: if the thumb hits 60% cup / 40% desk, it is the cup.

---

### S4 — Play (fuse + extra hits)

Same frame as S3. State change is the gesture, not a new screen.

**Office — Pile on (slice)**
- Tap = poke. Short swipe = flick. One thumb.
- First contact can be the cup (on-ramp) or any legal object.
- Extra contacts stay legal for the rest of the round.
- Copy: none on success.

**Checkout — hands off the scanner**
- Tap the legal fuse (frozen peas, coupon, soda bottle, cart). Extra hits on those stay legal.
- If they mash the scanner: copy `Nice try.` 0.8s, no modal. Calm / chain continues. Extra hits elsewhere still work.

**Kitchen — one poke**
- One contact, toss or poke, spent. Further grabs do nothing. Copy if they try: `You spent it.`

**Miss / snap / empty desk**
```
That helped.
```
Calm does not reload from boot. Instant.

**Thumb after the fuse:** allowed to pile on, except under One poke. A floating finger looking for a *toolbar* is still a fail. A floating finger looking for the plant is the product.

**Haptic 1 (commit / extra hit):** short, sharp tick. Same grammar for fuse and for rage-relief poke. "You did that."

**Sound:** the object's own sound (ceramic slosh, plant slap, mug crack). Fuse starts the sentence. Extra hits are asides in the player's voice.

---

### S5 — Chain and chain peak

**What is hidden during a chain**

Hide all of it:

- Title
- Constraint line
- Any remaining “tap to dismiss”
- Score, combo, CHAOS meters
- AGAIN / CLIP (they arrive in S5b/S6, not here)
- Situation rail
- Tool ghosts
- Watermarks
- “NICE” / “PERFECT” / floating +numbers
- Tutorial
- Settings

Allowed exceptions (quiet, no labels):

- Accessibility pause: a 44×44 dp invisible-until-focused control, top-left, away from the wreck, or system pause via OS.
- Reduce-motion users still get a chain; slow-mo becomes a longer freeze-frame instead of a speed ramp.
- Extra smash is physics, not chrome. It does not get a badge.

**Thumb:** extra taps smash (Pile on / Hands off). Ignored under One poke. No skip-to-end unless they background the app.

**Camera rules**

1. Follow the *active chain cause* with lag (~150–250 ms). The player should feel dragged by the joke, not by a cinebot.
2. Keep the next victim in frame before impact when you can. The lamp should be visible before the paper hits it.
3. If the chain splits, follow the stupider branch. Stupidity is the edit.
4. Never zoom in so far that the room is lost. Portrait must still say “office” at a glance.
5. Checkout: follow up the lane (scanner to bagging to soda pyramid to ASSISTANCE light), not across three tills.
6. **Extra smash does not steal the camera.** If they flick the plant during the copier scream, the plant juices in place; the lens stays on the chain. After the authored beat, S5b can pull back so they can aim.

**Slow-mo rules**

- Trigger on a *chain link* (A makes B into a problem), 2–3 times per chain, 350–700 ms each.
- Do not slow-mo a first-hand extra hit unless that hit *is* a chain link.
- Audio time-stretches. No trailer whoosh required.
- Do not slow-mo debris filler. Paper in the air is punctuation, not a peak, unless it kills the lamp.
- After a peak, snap back to 1× so the rest can get worse — and so extra hits still feel like hits at full speed.

**Haptics**

- Haptic 1 (extra hit): short tick on each first-hand poke/flick. "I did that."
- Haptic 2 (chain impact/link): heavier thud, scaled to mass. Printer ≠ paper.
- No rumble bed. If a chain link and an extra hit land the same frame, play both in order: tick, then thud. Do not chord them into mush.

**Sound**

- Foley is the sentence. Music ducks.
- Peak = the funniest *chain* contact, mixed loud and dry.
- Extra-hit foley sits slightly drier and closer (in the player's hand), never louder than the chain peak.
- Do not duck foley for a bass drop.

**Screen shake:** chain peaks only, small, camera-tracked. Extra smash can nudge locally. Constant shake is banned.

**Chain end:** when the authored beat is done (copier, stall collapse, fridge-down), not when every sprite has slept. Do **not** freeze. Hold 400–600 ms on the punchline frame at 1×, then pull back into S5b.

---

### S5b — Vent the wreck

Not a new screen. The chain has said its punchline. The office is still a physics toy.

**On screen**
- Live wreck. Copier still the stupidest thing in frame, but the whole office is readable again.
- Quiet **AGAIN** in the thumb zone (same size as S6). No CLIP yet unless the card is already up.
- No “smash the rest” checklist. No object outlines. No remaining-count.

**Thumb:** poke/flick anything legal. This is rage relief. Hits must feel better than calm hits — wreckage already has mass, sharp edges, things half-broken.

**Copy:** none. If they only watch, that is allowed. If they only smash and never look at the copier, the chain still happened; the card will tell them.

**Camera:** pulled back to the calm framing (wrecked). Optional tiny vertical peek, same as S3. No chase-cam on extra smash.

**Duration:** until they tap AGAIN, or until S6's dim strip has been up and they have had a beat to vent. Do not auto-retry. Do not time-out the wreck into a freeze while they are still hitting.

**Haptics / sound:** haptic 1 + object foley. Room tone of the wreck under it. No second music sting until they actually leave.

S6 may already be visible as a dim strip during S5b. That is preferred: verdict on, wreck still hittable. Taps on the strip's buttons are buttons. Taps on the wreck are smash.

---

### S6 — Punchline card

Overlay. The **live** wreck stays visible around and through the card. The card is a verdict, not a new location, and not a freeze-frame that kills vent.

**Layout (portrait, one-handed)**

```
┌─────────────────────────────────┐
│                                 │
│         [live wreck]            │
│                                 │
│      THAT ESCALATED QUICKLY.    │
│                                 │
│      CHAOS                 97%  │
│      SATISFACTION         112%  │
│      THINGS THAT DEFINITELY     │
│      WEREN'T YOUR FAULT    43   │
│      I DID THAT            12   │
│                                 │
│  ┌──────────────┐ ┌───────────┐ │
│  │    AGAIN     │ │   CLIP    │ │
│  └──────────────┘ └───────────┘ │
│         [thumb zone, 72dp+]     │
└─────────────────────────────────┘
```

- Headline: one line, centered, over the wreck. Sits on a dim strip (not a solid sheet that hides the copier or eats smash targets).
- Stats: left labels, right numbers. Four rows. SATISFACTION may exceed 100%. That is the joke. Do not clamp it to look professional.
- THINGS THAT DEFINITELY WEREN'T YOUR FAULT wraps to two lines. Do not shorten to “FAULTS” or “NPC HITS.”
- **I DID THAT** is exact. Do not rename to “HITS,” “DAMAGE,” or “YOUR FAULT.” Under One poke it can read `0`. That is funny.
- **AGAIN**: primary, ≥ 72×56 dp, lower-left or full-width if CLIP is absent. High contrast. Both thumbs can hit it without a grip change.
- **CLIP**: same height, secondary. Shares the *chain*, not the smash-more, not this card. Omit CLIP entirely if export is not in the slice. Do not ship `CLIP (SOON)`.
- After first office punchline, a one-line rail above the home indicator, not a third button:
  - `Kitchen’s worse →`
  - After kitchen: `Lane 4 →`

**Exact headline copy (rotate, match situation and how it died)**

| When | Copy |
| --- | --- |
| Default good chain | `THAT ESCALATED QUICKLY.` |
| Office, copier finale | `THE PRINTER STARTED IT.` |
| Extra hits high, punchline fired | `I DID THAT.` (headline, rare; usually keep it as the stat) |
| Extra hits high, punchline missed | `YOU NEEDED THAT.` |
| Tiny chain, they smashed | `YOU JUST HIT THINGS.` |
| Tiny chain, they didn't | `YOU JUST POKED IT.` |
| Checkout, they never touched the scanner | `NOT YOUR PROBLEM.` |
| Checkout, soda pyramid | `THE SODA KNEW.` |
| Kitchen | `THE TOASTER KNEW.` |
| Huge chain | `MAKE IT WORSE.` |

MAKE IT WORSE earns the headline when the spiral actually did. Do not print it on a 2-hit flop. `YOU WERE HOLDING A RUBBER BAND.` waits for that later constraint.

**Never on this card:** Great job, Victory, Continue, Watch ad, +50 XP, stars, chests, Damage/Precision/Combo meters, a graph, “objects remaining.”

**Thumb:** AGAIN (required), CLIP (optional), rail (optional), **wreck (smash, still)**. Hit-testing: buttons win in their rects; wreck wins everywhere else. No swipe-to-dismiss that accidentally retries.

**Camera:** live, pulled back. No extra slow-mo under the type. Do not freeze unless Reduce Motion needs a still.

**Haptic 3:** one longer hit when the strip arrives (punchline), then extra hits can keep ticking (haptic 1). Hands do not go fully quiet until AGAIN.

**Sound:** music sting when the strip arrives, then room tone of the wreck. Punchline is readable in silence; extra smash can still speak. The shareable joke is still the chain.

**Numbers (how they should feel, not a formula dump)**

- **CHAOS** — 0–100%+ of how out of control the *chain* got, not how many meshes they punched.
- **SATISFACTION** — did the spiral hit the joke. Over 100% is allowed on a good first office chain.
- **THINGS THAT DEFINITELY WEREN'T YOUR FAULT** — integer count of chain collateral. Mean. Not their extra hits.
- **I DID THAT** — integer count of extra objects they personally wrecked. Rage relief, numbered. Must move when they pile on.

Seed the first office success high enough that the card is funny, not a scolding. Retry is for a *better* joke or a meaner hit, not for unlocking the right to laugh.

---

### S7 — Retry

Not a screen. AGAIN on S6 hard-cuts to S3 of the **same** situation, **same** constraint.

**Copy:** none. No “Round 2.” No loading joke.

**Thumb:** one tap. Time-to-calm target: < 0.4s perceived. If the scene must rebuild, hold the wreck until it is ready. Never show a spinner on a black field.

**Ghost:** last *fuse* silhouette at 15% opacity for ~0.6s, then gone. Mastery aid, not a ghost hand tutorial. Do not ghost every extra smash — that becomes a checklist.

**Sound:** annoyance bed returns. Commit haptic resets.

**Do not:** change the constraint, open a tool picker, play an ad, ask to rate the app, or send them to a map.

---

### S8 — Share clip

System share sheet. Input is the chain replay (video or live-recap), 5–15s, from fuse through punchline. Not the stats card. Not a montage of leftover smash unless a smash *was* a chain link.

**In-game copy on CLIP:** `CLIP`

**Suggested share text (prefilled, editable, dry)**
- Office: `The printer started it.`
- Checkout: `The scanner started it.`
- Kitchen: `The toaster knew.`
- Generic: `MAKE IT WORSE.`

Watermark: small **OOPS-PLOSION** in a corner of the *video*, not a banner over the punchline. No “Download our app!” end card in the slice.

If CLIP cannot export the chain, do not show CLIP.

---

### S9 — Next situation (rail only)

Not a map. After S6 has been seen once:

```
Kitchen’s worse →
```

Then:

```
Lane 4 →
```

Tap loads S1 of that situation. Same whole flow. No unlock chest. No “are you sure you want to leave this rubber band.”

Office remains replayable forever via AGAIN.

---

## Copy sheet (all player-facing lines)

**Boot**
- `OOPS-PLOSION`
- `MAKE IT WORSE.`

**Titles**
- `SUNDAY AT THE OFFICE` / `The printer has opinions.`
- `LANE 4` / `UNEXPECTED ITEM.`
- `SUNDAY BREAKFAST` / `The toaster is already lying.`

**Constraints**
- `Poke it. Then pile on.`
- `Hands off the scanner. Pile on the rest.`
- `One poke. That's the whole budget.`

**Miss / illegal**
- `That helped.`
- `Nice try.`
- `You spent it.`

**Punchline headlines**
- `THAT ESCALATED QUICKLY.`
- `THE PRINTER STARTED IT.`
- `YOU NEEDED THAT.`
- `YOU JUST HIT THINGS.`
- `YOU JUST POKED IT.`
- `THE SODA KNEW.`
- `NOT YOUR PROBLEM.`
- `THE TOASTER KNEW.`
- `MAKE IT WORSE.`

**Stats labels (exact)**
- `CHAOS`
- `SATISFACTION`
- `THINGS THAT DEFINITELY WEREN'T YOUR FAULT`
- `I DID THAT`

**Actions**
- `AGAIN`
- `CLIP`
- `Kitchen’s worse →`
- `Lane 4 →`

**Banned**
- Welcome, Let’s go, Unleash, Great job, Victory, Continue, Watch to retry, Tap to smash, Combo, +XP, Locked, Daily reward, Claim, Objects remaining, Smash the rest.

Voice: short, dry, a little mean, never corporate. Insult the printer. Do not insult the player’s life.

---

## Camera / slow-mo / haptics / sound (quick rules)

| State | Camera | Slow-mo | Haptics | Sound |
| --- | --- | --- | --- | --- |
| Boot | Static | No | No | Dry sting |
| Title / constraint | Locked on calm frame | No | No | Situation bed in |
| Calm inspect | Locked + optional vertical peek | No | No | Annoyance loop, music low |
| Fuse / extra hit | Still locked (calm) or chain-follow (S5) | No | Tick (1) | Object foley, close |
| Chain | Follow active *chain* cause, lag, keep next victim framed. Extra smash does not steal camera. | No, except peaks | Thud on links (2) | Foley sentence, music ducks |
| Chain peak | Hold the link in frame | 2–3 hits, 350–700 ms | Strongest *chain* hit of the frame | Time-stretch foley |
| Vent wreck (S5b) | Pull back to office frame | No | Tick on extra hits (1) | Wreck tone + smash foley |
| Punchline strip | Live wreck, pulled back | No | Long hit on strip in (3), then ticks allowed | Sting, then wreck tone |
| Retry | Cut to calm | No | Reset | Bed returns |

Haptics and sound outrank badges. If a number wants to appear before S6, it does not. Extra smash never gets a floating +1.

---

## Portrait, one-handed, fat-finger

- Aspect: **authored 9:16.** Survive **~19.5:9–20:9** by keeping fuses out of the top 12% and actions in the bottom 18%. Extra height on taller phones is letterbox in those bands, not a restage. Named CSS viewports (must-pass A–F, soak G–J) live in `docs/prd.md` Platform — QA those, not a desktop monitor.
- One hand: all required taps live in the lower two-thirds. AGAIN/CLIP in the thumb zone. Fuses and vent objects are in-world, not a top-right weapon.
- Left and right thumbs: no band origin in the slice. Hits are on objects.
- Hit targets: 56 dp minimum on fuses and vent objects, 72×56 dp on AGAIN/CLIP.
- No pinch-zoom. No two-thumb combos. No landscape requirement. No unique layout per SKU. iPad 3:4 is pillarbox-9:16, not a layout. Fold inner tablet is out.
- Peek drag is vertical, damped, optional. If the situation cannot read without peek, restage the situation.
- Checkout is staged as a portrait lane (scanner + bagging in the lower/mid third, soda pyramid and next-lane ASSISTANCE light in the upper third). If it will not read, restage props, do not add zoom.
- During S6, wreck smash targets must still live outside the dim strip. If the strip covers the plant, shrink the strip, do not steal the vent.

---

## Accessibility

The joke is visual and sonic. Accessibility is how more people get the same joke, not a settings novel.

**Must in slice**
- Dynamic type on all chrome copy (title, constraint, end card). Scene art can stay. If type hits two lines, the card grows; it does not overlap AGAIN or eat the last smash target.
- Contrast: labels and numbers on a dim strip that still shows wreck in the margins. Do not put pale grey on wreckage.
- Reduce Motion: no shake, no speed-ramp slow-mo. Replace peaks with a longer freeze on the link (still 2–3 peaks). Chain remains watchable. Extra hits still juice with foley/haptic. The wreck may freeze for Reduce Motion users; that is the exception to live-wreck.
- Captions: punchline headline is on-screen text already. Optional closed captions for foley peaks (`[printer grinding]`, `[copier scream]`, `[mug crack]`) behind OS captions, not a custom UI.
- Pause: OS/system pause works. In-game pause is a quiet top-left hit that only appears if VoiceOver/Switch is on, or after a long-press that is documented in OS settings — never a fat pause button during a normal chain.
- VoiceOver (calm and card only):
  - Title: `Sunday at the office. The printer has opinions.`
  - Constraint: `Poke it. Then pile on.`
  - Fuse: `Coffee cup, on the edge.`
  - Vent object: `Plant, in the corner.`
  - Card: headline, then the four stats, then `Again`, `Clip`.
- VoiceOver during chain: do not narrate every collision or every extra hit. One hint on first contact: `Watch. You can still hit things.` Then silence until the card. Fighting TalkBack during the chain kills the fantasy the same way a HUD does.
- Haptics: respect system haptic off. Sound must carry the grammar alone (tick = your hit, thud = chain).
- Color is not the only fuse signal. The cup is a silhouette + placement + a tiny physical tell (steam, drip). Do not rely on a red outline.

**Must not**
- A settings tab in the first 60 seconds.
- Colorblind modes that recolor the whole cartoon into a UI demo.
- Auto-aim that steals the choice of fuse. Fat-finger forgiveness is sticky targeting on the object they meant, not “always the cup.”

---

## Fewest screens to prove the fantasy

Ship this and stop:

1. Boot (S0)
2. Office calm with title + **Poke it. Then pile on.** (S1–S3)
3. Finger poke/flick (S4)
4. Chrome-less chain with camera + slow-mo; extra hits legal, camera stays on the chain (S5)
5. Live wreck they can still hit (S5b)
6. Punchline strip with four joke stats, wreck still hittable (S6)
7. AGAIN (S7)

Kitchen and checkout are copies of that machine, not a new UX. CLIP is a plus if the replay is real. Everything else is how this becomes a mediocre smash app *or* a hands-off cartoon.

Pass: they start a chain, they also hit something themselves, they read the card aloud, they hit AGAIN. Fail: they hunt for a hammer dock. Fail: they tap around looking for more *UI*. Fail: they only watch. Fail: they only smash and never notice the copier.

---

## Daily revenge (later, not a screen)

One new irritation a day, ~30 seconds, habit layer, notifications, streaks — a different product. Do not put it in the slice, the boot, the rail, or the end card.

When the loop is proven, it can be one line on a future card: `Tomorrow’s worse.` Until then, it does not exist.
