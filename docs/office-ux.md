# Office UX — Sunday at the office

Companion to the vertical slice: **Jammed Printer** under **Pile on**. Not a PRD. Not an object bible. This is how the room, the items, the situation, and the trigger should read in one thumb on a portrait phone.

Locked for this room:

- Portrait, one thumb. Constraint: **Pile on.** Copy: `Poke it. Then pile on.` Landscape restage is out; rotate does not get a second cover. One 9:16 cover for the whole phone cluster (`docs/prd.md` Platform). Not a unique office per SKU.
- Title: `SUNDAY AT THE OFFICE` / `The printer has opinions.`
- Dual feel: the chain is watchable (**not my fault**); extra hits are first-hand rage relief (**I did that**). Extra taps smash during and after the chain. Camera follows the chain, not extra smash. Wreck stays live (S5b). End card has `I DID THAT`.
- Coffee cup is the loud first-session fuse. No tutorial finger.
- One blink: the printer. Copier is a sleeping punchline — a sliver must be in the calm frame.
- Fat-finger ≥56 dp. Safe areas: top 12%, bottom 18%.
- Object cap ~10. Plant is bystander/vent. No hammer dock. No cluttered desk of equal-weight props.

**Assumption:** camera is a 3/4 dollhouse, not walkable 3D. If art later goes flatter or deeper, the *cover* still has to parse in two seconds. Restage props before adding zoom.

---

## Feel of the situation

A first-time player, sound on, phone in one hand, should feel this before they tap:

**Sunday. Empty. One machine still picking a fight.** Fluorescent leftover. Too bright for how quiet it is. Nobody else came in. The printer did.

At two seconds a stranger should be able to point at the printer. Not because a label says so. Because it is the only thing *alive* in a dead room: one error blink, a tongue of jammed paper, a cheap grind in the bed. The title has already named it and left. The constraint has already said `Poke it. Then pile on.` and receded. What remains is a still that is slightly wrong.

The cup is why they *want* to poke. Not the printer. The printer is the irritation. The cup is the thought they already had.

It sits on the lip of the desk, too close to the tray, steam lifting, a wet ring already drawn toward the machine like a spill that started without them. The thumb does not read “smashable prop.” The thumb reads **that is going to go in there.** Poking is finishing the sentence. That is the on-ramp. If they do not feel the cup as a sensory accident waiting to happen, they will mash the blink, hunt for a hammer, or sit on their hands.

Dual feel is planted in the still, not in copy:

- The cup + printer is a cartoon about to run away from them. After they commit, they are supposed to **watch**. “Not my fault.”
- The plant in the corner, the bag, the chair’s back — those look personally hittable. During the joke, and after it, the same thumb can still do something mean. “I did that.”

If the still only looks smashable, this is a rage room. If the still only looks like a Rube Goldberg, they will poke once and fold their arms. The cover has to sell both without a HUD novel.

**Sensory, not copy.** What makes them commit is:

- **Blink** — printer error LED, one, slow, ugly. The only light that behaves like a problem.
- **Steam** — cup, lazy, continuous. Motion that is not a blink. Reduce Motion: drop the loop; the wet ring and the lip still do the job.
- **Wet ring** — dark comma on the desk, pointing at the tray. Color is not the only signal; the ring is a shape.
- **Lip** — cup not nested safely in the desk’s middle. Unstable silhouette. Grabable.
- **Sound** — printer stutter under a thin Sunday hum. Ceramic almost-tick if the cup is that close. Phone rings in the *world*, quiet, far, not a badge. No steam hiss that drowns the grind.
- **Haptic** — none until a hit. Calm is eyes and ears.

They should not need a finger ghost. If the cup needs a finger ghost, the cup is in the wrong place.

---

## The room as a cover

Treat S3 like a magazine cover of a crime that has not happened yet. One portrait frame. **Authored 9:16.** Survive **~19.5:9–20:9** by keeping essential silhouettes out of the top 12% and the bottom 18%. Taller phones get extra letterbox *in those bands*, not a restage.

The readable cover is the middle ~70%. **In-frame is not occupancy.** The situation stack (lamp → copier sliver) must *fill* that band: you are sitting at the crime, not standing in the doorway. Empty olive is gaps between silhouettes, not full-width ceiling and floor slabs. Primary restage is the authored camera dolly (and FOV if the lip fish-eyes). Do not scale the cup as the occupancy fix. Do not fill a landscape window.

QA measures a calm, no-drag PNG of the **playfield** (crop the 9:16 pane first if the browser is wide). Working band = `0.12H`–`0.82H`. Author at viewport **C** `390×844`; A–F must show the same cover (±4 pp).

| ID | Fail a stranger can call |
| --- | --- |
| COV-01 | Lamp-to-copier stack height **< 0.60H**, or cluster stuck in the middle third |
| COV-02 | Desk + printer + cup + fan own **< 38%** of working-band height or **< 55%** of its width |
| COV-03 | Full-width empty olive slab inside the working band taller than **0.08H** (ceiling above the lamp or floor below the chair) |
| COV-04 | Cup width **< 0.09W** (peppercorn) or **> 0.20W** (mug ate the vents) |
| COV-05 | Printer smaller than the cup on screen, or blink outside `0.50H`–`0.58H` |
| COV-06 | Copier missing until peek, or copier is the hero mass |
| COV-07 | Lamp or fan gone / only in the top 12% |
| COV-08 | Viewport B or E is a different office than C; 1920×1080 as the proof |
| COV-09 | Cup, blink, lamp shade, or copier literacy sliver lives in the top 12% or bottom 18% |
| COV-10 | Occupancy pass that is a smash catalog (plant as loud as the cup) |
| COV-11 | Player pinch/zoom/orbit used to occupy the frame |

The chain should travel *through* that frame, mostly **down**: cup and printer in the working band, lamp and fan above them, chair below, copier as the thing waiting under the fold.

**Do not draw twenty offices.** Top-10 iOS + top-10 Android are test devices. QA screenshots the named CSS viewports in `docs/prd.md` (must-pass **A–F**: 360×780, 360×800, 390×844, 393×852, 412×915, 430×932). "Looks fine on my monitor" is not a pass. iPad 3:4, landscape, and Fold-inner tablet are out; pillarbox the same 9:16 if they appear.

### Portrait layout (calm)

```
┌─────────────────────────────────┐
│  [top 12% — notch, empty air]   │
│     hanging lamp  ·  fan        │  ← quieter, readable, not blinking
│                                 │
│        [PRINTER]  blink         │  ← two-second read, named annoyance
│     paper tongue out of jam     │
│   (steam) CUP on the LIP → tray │  ← loud fuse, spill vector into printer
│        phone (small, ringing)   │
│                                 │
│     chair (wobbly, in front)    │
│     plant (corner, still)  bag  │  ← vent silhouettes, not the read
│  ▄▄ copier sliver ▄▄            │  ← sleeping punchline, must be in frame
│  [bottom 18% — thumb rest]      │  ← no essential props, later AGAIN
└─────────────────────────────────┘
```

**Where things sit, in the hand:**

| Thing | Band | Why |
| --- | --- | --- |
| Hanging lamp | Upper third, *below* the 12% safe. Off-center so a swing has somewhere to go. | Ceiling joke. Must be visible before paper hits it. Not a blink. |
| Fan | Same band as the lamp, opposite side or on a file cabinet beside the printer’s head. | Paper’s next job. Blades readable at arm’s length. **On** in calm, lazy mechanical spin — not an alarm. A still fan makes yank-the-jam a prayer. |
| Printer | Dead center of the *cover*, slightly left or right of true center so the cup can own a lip. Blink at ~50–58% of screen height. | The irritation. Biggest machine in the working band. One LED. Jam tongue. LCD is in-world, small, mean if you look, not a billboard. |
| Coffee cup | Lower-mid of the readable frame, **above** the 18% thumb rest. On the desk lip, between the player and the tray, or beside the tray with the ring aiming in. | Reachable without covering the blink. Fat. Guilty. Spill vector is a composition line, not an arrow. |
| Phone | On the desk, smaller than the cup, farther from the lip. | Audio fuse for retry. Must not compete: no LED war, no huge screen. |
| Chair | Below the desk mass, seat readable, one caster aiming at the copier. | Mass. Wobble if you look. Path into the punchline. |
| Plant | Back corner, opposite the cup. Pot + leaf cluster. Darker, still. | Bystander. Hittable. Not the two-second read. |
| Bag | Slumped on the floor beside the chair, or hanging off the chair back. Soft silhouette. | Tenth object. Vent toy. Not a second cup. |
| Copier | Bottom of the readable frame. A **sliver**: lid corner, input tray, or the stupid bulk of one flank. | Sleeping punchline. Dark. Not blinking. If they peek, they get more of the beast. They must not *need* the peek to know something fat is waiting. |

**Frozen PC:** set dressing only. A monitor in the back with a frozen hourglass or a stuck beach ball, dim. Not in the object cap. Not a tap target. If the thumb hits it, sticky targeting prefers the cup, the printer, or empty desk — never a secret eleventh toy.

### What blinks

**One blink: the printer.** Slow, ugly, error-red or error-amber. It is the only light that behaves like a problem.

What must not blink, pulse, or “UI” in calm:

- Copier ready light
- Phone LED / lock-screen flash
- PC
- Lamp (it can *hang*; it cannot strobe)
- Fan (motion of blades, if any, is mechanical, not an alert)
- Steam (motion, not a blink — different grammar)

Steam, wet ring, jam tongue, and the copier sliver are *tells*. Only the printer is an *alarm*.

### What must not compete

No cluttered desk of equal-weight props. Keyboard, stapler, mouse, pens, sticky notes, a second steaming mug, a mug tree, a framed photo that wants to be smashed — those are texture or they are out. If a prop has a 56 dp hit and a fun break, it is in the cap. If it is just noise, bake it into the desk art.

No hammer dock. No tool tray. No ghost finger. No “tap here” chevron on the cup. The cup’s job is to look like it will fall. The printer’s job is to look like it already hates you. That is the whole legend.

The plant must look smashable **without** matching the cup’s visual volume. Rule of thumb: cup is the loudest small object; printer is the loudest machine; plant is a quarter of the cup’s “please touch me” energy. Same for the bag. If plant + bag + chair all scream as loud as the cup, the two-second read dies and this becomes a smash room with a printer in it.

### Peek vs restage

Calm camera is locked. Optional short **vertical** drag to peek overflow. Damped. Lift to settle. Drag does not fling objects. No pinch. No horizontal pan.

**The copier sliver is mandatory in the calm frame.** Peek is for the greedy player who wants to see the rest of the sleeping punchline, not for literacy. If QA cannot name “there is a copier” from a screenshot with no drag, restage. Do not teach peek. Do not put a peek chevron. If the chain cannot travel through one portrait plus that sliver, the room is too tall.

**Assumption:** a tiny bit of copier below the fold is allowed as *extra* bulk after the sliver has already said “fat machine downstairs.” The authored chain still has to keep the next victim in frame; peek is a calm-only courtesy.

Sunday light: leftover overhead, a little cold, a little too even. The cup and the blink get the contrast. Do not romanticize the office. Do not make it a toy catalog.

---

## The items in the hand

Cap ~10 interactive. Each needs a silhouette the thumb can mean at arm’s length, a hit feel (fuse vs vent vs both), and a belief about what will happen. Hits are ≥56×56 dp even if the art is smaller; sticky targeting: if the thumb is 60% cup / 40% desk, it is the cup.

Gesture is always The Finger: tap = poke, short swipe = flick. No dock. Extra contacts are legal for the whole round.

**Hit grammar (same thumb, two voices):**

- **Fuse / chain link:** haptic 2 (thud, scaled to mass) + foley that continues the sentence. Camera may follow. Slow-mo only on a *link*.
- **Vent / extra hit:** haptic 1 (sharp tick) + drier, closer foley. “I did that.” Camera does not come. No badge.

If a chain link and an extra hit land on the same frame: tick, then thud. Do not mush them.

### Loud (first-session)

**Coffee cup** — fuse, on-ramp. Ceramic mug, dark liquid, steam, wet ring, on the lip. The thumb believes: *it will go in the printer.* Poke tips it; flick throws it. First-session proof: this contact starts cup → printer. Direct hit juices as theirs (tick + slosh) *and* lights the spiral. Do not double-count the fuse object on `I DID THAT`; this was their idea, not their extra wreckage.

**Printer** — named annoyance, not the on-ramp. Boxy silhouette, jam tongue, one blink, small LCD. The thumb believes: *this is the problem.* Poking it is legal under Pile on and **lame** (see Trigger). Mass thud if it actually moves. It must feel like a machine, not a piñata. Hitting it as an *extra* after a cup fuse can count as authored vent if it was not already the fuse — but the first-session player should not need to farm the printer. The copier is the joke; the printer is the victim that started it.

### Chain mids (readable links, quieter as first taps)

**Paper jam / stack** — the tongue hanging out of the printer, plus a small stack if needed. Silhouette: a white flag of failure. The thumb believes: *I can yank that.* Retry fuse: yank / flick the jam into the fan. Must play differently from the coffee spill (paper flock vs wet electronics). As extra smash, paper is weak vent — flutter, not rage. Do not make it the `I DID THAT` toy.

**Fan** — desk or cabinet fan, blades readable, grille. The thumb believes: *that will throw things.* Quiet fuse or mid-chain. Direct poke might lurch it on; flick aimed at paper is retry bait. Not loud in calm (no blink, no steam). If they start here, the sentence should skip the coffee and still be able to reach lamp → chair → copier. If it always becomes “the coffee chain anyway,” this fuse is unfinished.

**Hanging lamp** — one pendant, cord, shade. The thumb believes: *it will swing into something expensive.* Retry bait. Poke is a nudge; flick is a shove. Fuse: lamp → chair → copier, a *different mid* than coffee’s paper storm. In the wreck, a still-swinging lamp is the thing they point at and say “next time I start there.”

### Punchline

**Copier** — sleeping bulk, sliver in calm, stupid when awake. The thumb believes: *that thing will not stop.* First tap on the copier in calm should feel like waking a dog that was not theirs to wake: legal, heavy, not the on-ramp. A copier-first poke may grind and spit one sheet (lame, like the printer) unless they flick it into the chair — and even then it should not steal the coffee’s first-session job. The punchline is the copier *receiving* the chair, then refusing to stop (`PRINTING 1 OF 847` or a scream-loop). During the chain it is the camera’s last job. After the beat it stays live. Smashing the copier by hand in S5b is allowed and should feel like punching the punchline; it still does not steal CHAOS from the chain.

### “I did that” toys (vent-scale, also legal fuses)

These must juice on a direct hit even when they light nothing. At least three satisfying direct hits in the slice: **plant, bag, chair.** Phone is a bonus if the vibe-walk fuse is distinct.

**Wobbly chair** — both. Silhouette: cheap task chair, one caster traitor. The thumb believes: *that will go across the room.* As chain mid, it is the mass that sells the copier. As vent, it is a shove they can feel in the palm (heavy thud if it is a chain link; tick + scrape if it is their extra flick). Do not make calm-chair so twitchy that it starts the chain without a hit.

**Plant** — bystander / vent. Pot + leaves, corner, still. The thumb believes: *I could knock that over and it would be mine.* It is tagged bystander: if the *chain* knocks it, that is `THINGS THAT DEFINITELY WEREN'T YOUR FAULT`. If *they* knock it, that is `I DID THAT`. It must not steal the two-second read (no motion, no steam, no blink, smaller “please touch” than the cup). During S5 it is the thing they glance at while the copier screams. During S5b it is the first extra hit many people take. Direct hit: slap of leaves, crack of pot, dirt — closer foley, tick. Do not cartoon-explode it into the copier unless they aimed it there; a plant that always joins the official sentence steals authorship.

**Bag** — vent. Tote or backpack, slumped, soft. The thumb believes: *that’s someone’s stuff.* Tenth object. Not a fuse competitor. Direct hit: fabric thump, contents spill if you want one beat of meanness. Retry bait only as “I want to hit the bag harder,” not as a fourth identical chain. If budget pinches, cut the bag before the plant.

**Phone** — retry fuse + weak vent. Desk phone or mobile, small, ringing in the world. The thumb believes: *if I bump that it will walk.* Fuse: vibration walks into the coffee, which then does the on-ramp chain — a *different start*, same later sentence is acceptable if the *mid* (phone hitchhiking) is visible. Direct smash: crack, ring cut off. Must not blink. Ring is audio + a tiny physical buzz, not an LED.

### What the thumb should not find

A hammer. A second steaming cup. A drawer of equal toys. A PC that is secretly smash-critical. An invisible wall. A shop button on the copier.

Empty desk: `That helped.` Still calm. Instant. No modal.

---

## The trigger

Beat-by-beat, first session, no lecture.

**0. Title over the still.** `SUNDAY AT THE OFFICE` / `The printer has opinions.` They already know who the jerk is. Thumb rests.

**1. Constraint recedes.** `Poke it. Then pile on.` One line, lower third, *above* the 18% thumb rest so it is readable. Then gone. The Finger is the verb. No tray.

**2. The cover acts.** Printer blinks. Cup steams. Ring sits. Phone rings far away. Copier sleeps in the sliver. Plant is a still life. No haptic. The eye goes blink → cup. That order is the design. If the eye goes plant → bag → “where is the hammer,” the cover failed.

**3. Commit on the cup.** The thumb wants the unstable thing, not the alarm. Poke or short flick. Fat target. On contact: haptic 1, ceramic + slosh. That is “my idea.” The spill vector does the rest — into the tray, not into a random desk void. If a poke on the lip can miss the printer, the cup is too far or the tray is unread. Restage before adding magnetism.

**4. They watch, and they may pile on.** Chrome gone. Camera rides the chain, not their extra smash. The plant is still standing. The bag is still there. A second tap is legal and feels like *theirs*. They are not required to take it. First-session success is: chain happens. First-session *proof of the product* is: chain happens **and** they personally wreck one extra thing they can point at.

### Coffee as on-ramp

The cup is loud on purpose. Steam, wet ring, lip, spill line into the tray. It is not a puzzle. Attempt one should get cup → printer without cleverness. Clever fuses (jam yank, lamp, phone walk) are what they see *during* that chain and come back for.

**Assumption:** if they flick the cup *away* from the printer, it can fail as a joke (`That helped.` if it hits nothing; or a short wet mess with no spiral). Do not auto-aim the cup at the tray. Fat-finger sticky targeting is “they meant the cup,” not “they meant the win.” A miss that still looks like *their* poke teaches the lip. A magnet that always scores teaches nothing.

### Why poking the printer is legal but lame

Under **Pile on**, the annoyance is not locked. First-timers will mash the blink. That cannot be a dead tap (except later, under **Hands off the annoyance**).

Poke the printer: error beep, blink speeds up, maybe the jam tongue shivers, maybe one sheet coughs out and dies. Zero to two events. No copier. No slow-mo peak. Camera stays. Constraint does not scold.

It is legal because this is rage relief plus a fuse game, not a gotcha. It is lame because **the irritation is the subject of the joke, not the match.** The cup is the match. A printer-first run should feel like they slapped the thing that was already broken. If they then poke the cup, that cup can still light the real sentence (a new branch). If they only mash the printer and the plant, the card can still talk: low SATISFACTION, some `I DID THAT`, `YOU JUST HIT THINGS.` / `YOU JUST POKED IT.`

Do not print a tutorial. The lameness *is* the teacher.

Later, **Hands off the annoyance** (same room, not the slice): printer tap denies — beep, no chain, `Nice try.` Extra hits elsewhere stay legal. Fuse must start on cup, paper, lamp, phone, fan, chair.

### Why the plant looks hittable without stealing the two-second read

The plant has to pass a cruel test: in a two-second screenshot, nobody points at it first; in a ten-second inspect, the thumb *wants* it.

How:

- Corner. Back. Still. No steam, no blink, no ring.
- Silhouette is obvious (pot + leaves), hit ≥56 dp, but visual volume is well below cup and printer.
- It is the only friendly living thing in a machine room. That is the meanness. You do not need a highlight to want to knock over the innocent one.
- During the chain it stays in peripheral vision while the camera chases paper and lamp. After the copier scream, pull-back puts it back in the hand. That timing is the invitation to pile on — not an outline, not a “smash the rest” checklist.

If the plant animates in calm (breeze, bounce), it becomes a second fuse and the cover splits. Leave it dead until hit.

---

## Chain sentence (readable)

The shareable sentence, camera and foley, not a particle weather report:

**cup → printer → paper → fan → lamp → chair → copier**

Portrait must still say “office” at a glance. Never zoom so far the room is lost. Extra smash does not steal this lens.

| Beat | What they see | Foley / haptic | Camera / juice |
| --- | --- | --- | --- |
| 1. Cup commits | Ceramic tips on the lip. Wet ring smears. Steam follows the fall. | Slosh + tick (haptic 1). Close. Theirs. | Still on the calm cover until the tray is about to be hit. |
| 2. Coffee hits printer | Liquid into tray / LCD. Blink goes feral. Grind. Jam worsens. | Wet + grind. Thud (haptic 2), machine mass. | Hold the contact. **Slow-mo 1** on the moment the printer *becomes* the problem. Next victim (paper) already in frame. |
| 3. Paper | White flock, jam tongue ejects, stack lifts. Readable sheets, not confetti weather. | Flutter, slap. Lighter thud. | Follow paper toward the fan. Keep the fan visible *before* impact. |
| 4. Fan | Blades take paper and throw it. A second sheet may go stupid. | Chop, whir up. | **Slow-mo 2** if this is a link (paper makes the fan a weapon). Then 1× so it can get worse. |
| 5. Lamp | Paper or wash hits the pendant. Shade swings, light scythes the desk. | Pop / clink / cord creak. | Lamp was already in the upper third. Follow the swing; keep the chair in frame before impact. |
| 6. Chair | Mass. Casters betray it. It scoots or tips toward the sliver. | Scrape, heavy thud. | Follow cause → effect, lag 150–250 ms. The copier sliver grows into the punchline as the chair arrives. |
| 7. Copier | Sleeping bulk wakes. Lid, tray, scream. In-world LCD: `PRINTING 1 OF 847` (or equivalent stupidity). It will not stop. | Copier scream. Strongest chain thud. | **Slow-mo 3** on chair-into-copier *or* hold 400–600 ms at 1× on the stupidest still. Then pull back. Do not freeze the world. |

Two or three slow-mo links, not twelve. Shake only on those peaks, small. Music ducks. Foley is the sentence. Reduce Motion: longer freeze on the same links, no speed ramp, no shake; punchline still reads.

If the chain splits, follow the stupider branch. Stupidity is the edit.

**Other fuses must not be the same sentence with a different first noun.** Minimum distinct mids:

- **Coffee:** wet electronics → paper storm → fan → lamp → chair → copier.
- **Yank jam:** dry paper into fan first; printer may join late; skip the slosh if they never spilled.
- **Lamp:** gravity and mass; chair into copier with little or no paper flock.
- **Phone walk:** hitchhiking buzz into the cup, *then* the coffee sentence — the visible joke is the phone arriving, not a teleported spill.

If two of those produce the same mid, one is unfinished.

### What they notice in the wreck (why retry / why pile on)

Pull back to the calm framing, wrecked. Copier still the stupidest thing in frame. Live. S6 dim strip may already be up; smash around it.

They should be able to point at:

- **A chain thing they never touched** — paper in the fan, lamp still swinging, copier screaming. That is **not my fault.** That is retry bait: “I want to start with the lamp.”
- **A thing still standing that looks like theirs** — plant, bag, a chair caster that didn’t finish, the phone under a sheet. That is **I did that** bait: “I want to hit the plant myself.”
- **A fuse they didn’t use** — jam tongue still hanging if they started on the lamp; cup still on the lip if they started on the phone and missed. Ghost on retry: last *fuse* at 15% opacity for ~0.6s, then gone. Do not ghost every extra smash.

Meaner extra hit in S5b should feel *better* than calm hits: half-broken mass, sharper edges, dirt already out of the pot. It is not a cleanup mode. No outlines. No remaining-count. Camera stays pulled back. Their smash juices in place.

The clip is the chain. The plant slap is for the hand.

---

## Copy in this room

Only lines the player can see or hear in **Sunday at the office**. Voice: short, dry, a little mean. Insult the printer. Do not insult the player’s life. No Welcome, Let’s go, Unleash, Great job, Smash the rest.

### Title (S1)

```
SUNDAY AT THE OFFICE
The printer has opinions.
```

VoiceOver: `Sunday at the office. The printer has opinions.`

### Constraint (S2, slice)

```
Poke it. Then pile on.
```

VoiceOver: `Poke it. Then pile on.`

Later on this same floor (not the slice):

- Hands off: `Hands off the printer. Pile on the rest.` **Assumption:** matches checkout’s grammar; confirm when that constraint ships. Deny on printer: `Nice try.`
- One poke: `One poke. That's the whole budget.` Further taps: `You spent it.`

### Miss / empty desk

```
That helped.
```

No modal. Calm stays.

### In-world (not chrome)

- Printer LCD, calm: a jammed error, small, readable if they look, not a quest log.
- Printer / copier LCD, punchline: `PRINTING 1 OF 847`
- Frozen PC (set dressing): stuck UI, not a subtitle.

Optional captions behind OS, not custom UI: `[printer grinding]`, `[copier scream]`, `[mug crack]`, `[plant slap]`.

VoiceOver, calm only: `Coffee cup, on the edge.` / `Plant, in the corner.` During chain, one hint on first contact then silence: `Watch. You can still hit things.`

### Punchline headlines (S6, office)

Rotate from observable conditions (see PRD). Office-facing lines:

| When | Line |
| --- | --- |
| Punchline fired, chain ≥ 4 | `THAT ESCALATED QUICKLY.` |
| Punchline fired, `I DID THAT` ≥ 3 | `THE PRINTER STARTED IT.` |
| Huge spiral | `MAKE IT WORSE.` |
| Extra hits high, punchline missed | `YOU NEEDED THAT.` |
| Tiny chain, they smashed | `YOU JUST HIT THINGS.` |
| Tiny chain, they didn’t | `YOU JUST POKED IT.` |

`I DID THAT.` as a *headline* is rare; keep it as the stat almost always.

Share prefill (CLIP): `The printer started it.`

### Stats labels (exact)

```
CHAOS
SATISFACTION
THINGS THAT DEFINITELY
WEREN'T YOUR FAULT
I DID THAT
```

`I DID THAT` does not rename. Under One poke it can read `0`. That is funny.

### Actions

```
AGAIN
CLIP
Kitchen’s worse →
```

CLIP omitted if the chain cannot export. Rail only after this office has punched once.

### Banned in this room

Hammer copy, object counters, combo badges, `NICE`, CHAOS popups on collision, “smash the rest,” a tutorial finger, a peek chevron, anything that explains the cup in words.

The cup is steam, a ring, and a lip. The printer blinks. The copier waits in the sliver. The thumb already knows.