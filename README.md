# Leafbook
An app for journaling your plants

## Implementation roadmap (Leafbook)

### Phase 0 — Foundations (shared)
- [x] Define core product copy + brand:
  - [x] App name: **Leafbook**
  - [x] Logo direction: **Pressed leaf bookmark** (page outline + pressed leaf + bookmark ribbon)
- [x] Create Supabase project
- [x] Configure Supabase Auth (email/password + OAuth later)
- [x] Create Postgres enums + tables:
  - [x] `profiles` (includes `role`: `user` | `admin`)
  - [x] Curated catalog: `plant_types`, `plant_type_photos`
  - [x] User plants: `plants`, `plant_care_preferences`
  - [x] Logging + journal: `plant_events`, `journal_entries`, `plant_issues`
  - [x] Media metadata: `plant_photos` (+ optional `journal_entry_photos`)
  - [x] Pots: `user_pots`
  - [x] Wishlist: `wishlist_items`
- [x] Add Supabase RLS policies:
  - [x] User-owned tables: `auth.uid() = user_id`
  - [x] Catalog tables: readable by users, writable by admins only
- [x] Create DB views for the Today screen:
  - [x] `v_plant_last_actions`
  - [x] `v_plant_effective_care` (preference-or-recommendation)
  - [x] `v_plant_due_tasks` (computed due/overdue; "Not started" when no history)

---

## Next.js (build first)

### Phase 1 — Next.js app skeleton + auth
- [x] Bootstrap Next.js (App Router + TS)
- [x] Supabase client setup (SSR + client)
- [x] Auth UI (sign in/up) + protected routes
- [ ] Marketing pages:
  - [x] Landing `/` (explains Leafbook + feature highlights + CTAs)
  - [ ] About `/about` (philosophy: journaling-first; tasks shouldn't feel like chores)

### Phase 2 — Plant Types catalog + discovery (read-only first)
- [x] Plant Types index `/plant-types`:
  - [x] search + basic filters (light, size, watering cadence)
- [x] Plant Type detail `/plant-types/[plantTypeId]`:
  - [ ] show catalog photos + recommended light/water/size (photos pending Vercel Blob)
  - [x] CTA: "Add to wishlist"
  - [x] CTA: "Add to my plants"
- [x] Ensure PlantType ↔ UserPlant linking model is implemented (`plants.plant_type_id`)

### Phase 3 — Wishlist (catalog-driven)
- [x] Wishlist page `/wishlist`
- [x] Add/remove wishlist item from PlantType detail
- [x] "Convert wishlist → owned plant" CTA:
  - [x] creates a `plants` row referencing the `plant_type_id`

### Phase 4 — User plants CRUD + profile narrative
- [x] Plants list `/plants`
- [x] Create plant flow:
  - [x] pick PlantType (optional) or enter free-text label
  - [x] name the plant
  - [x] set indoor/outdoor + light
  - [x] set "How I got it" + "Overall description" (living field)
- [x] User plant detail `/plants/[plantId]`:
  - [x] show link back to PlantType page
  - [x] show environment + narrative fields

### Phase 5 — "Anti-chore" care logging (fast, 1-tap)
- [x] Today page `/today` backed by `v_plant_due_tasks`
- [x] One-tap logging for:
  - [x] Watered
  - [x] Fertilized
  - [ ] Repotted
- [x] Task logging UX requirements:
  - [x] no mandatory forms
  - [x] default timestamp = now
  - [x] quick backdate
  - [x] inline confirmation + undo
  - [x] gentle language (no scolding "overdue!" tone)
- [x] Store actions as events (`plant_events`) and compute due dates from last event + cadence

### Next up (recommended order)
- [x] Plant detail page `/plants/[plantId]` — view/edit plant info, care history timeline
- [x] Quick backdate option for care logging
- [ ] Photo uploads via Vercel Blob (Phase 9)
- [ ] Repot workflow (Phase 6)
- [ ] Journal entries (Phase 7)

### Phase 6 — Pots inventory + repot workflow
- [ ] Pots page `/pots` (or in Settings)
  - [ ] add/edit/retire `user_pots`
- [ ] Plant has a `current_pot_id`
- [ ] Repot workflow:
  - [ ] choose date
  - [ ] choose pot from inventory or add new pot
  - [ ] write `plant_events(type=repotted, metadata={from_pot_id,to_pot_id})`
  - [ ] update `plants.current_pot_id`

### Phase 7 — Journal (long-form, personal)
- [ ] Add journal entry from UserPlant detail:
  - [ ] title optional, content required, backdating allowed
- [ ] Global journal feed `/journal` (filter by plant)
- [ ] Timeline presentation on plant detail:
  - [ ] interleave events + journal entries + issues

### Phase 8 — Issues + tracking
- [ ] Create issue flow (type + notes + date)
- [ ] Resolve issue flow
- [ ] Issue appears in timeline + plant health context

### Phase 9 — Photos (Vercel Blob) for users + catalog
- [ ] Vercel Blob integration via Next.js signed uploads:
  - [ ] User upload API route (validates Supabase session + plant ownership)
  - [ ] Admin upload API route for PlantType photos (validates `profiles.role=admin`)
- [ ] User plant photos:
  - [ ] upload photo (dated `taken_at`, optional caption)
  - [ ] show gallery + timeline integration
- [ ] PlantType catalog photos:
  - [ ] show primary + gallery on PlantType detail

### Phase 10 — Admin tools (catalog management)
- [x] Admin route protection (only `profiles.role=admin`)
- [x] Admin pages:
  - [x] `/admin/plant-types` list/create/edit
  - [x] `/admin/plant-types/[id]` manage details + photos
- [ ] Photo management features:
  - [ ] set primary, reorder, delete

---

## SwiftUI (mirror the same product)

### Phase 1 — SwiftUI app skeleton + auth
- [ ] Supabase Swift client setup
- [ ] Auth screens + session persistence
- [ ] Basic navigation structure (Today / Plants / Catalog / Journal / Wishlist / Settings)

### Phase 2 — Plant Types catalog + discovery
- [ ] Catalog list + search/filters
- [ ] PlantType detail screen:
  - [ ] recommended care + catalog photos
  - [ ] add/remove wishlist
  - [ ] "Add to my plants"

### Phase 3 — Wishlist
- [ ] Wishlist list screen
- [ ] Convert wishlist item → create UserPlant

### Phase 4 — User plants CRUD + narrative
- [ ] Plants list + create flow
- [ ] Plant detail screen:
  - [ ] link to PlantType detail
  - [ ] edit "How I got it" + "Overall description"

### Phase 5 — Today screen + 1-tap care logging
- [ ] Today list from `v_plant_due_tasks`
- [ ] One-tap Water/Fertilize/Repot logging
- [ ] Backdate + undo patterns (lightweight, non-blocking)

### Phase 6 — Pots inventory + repot workflow
- [ ] Manage pot inventory (`user_pots`)
- [ ] Repot flow selects pot and writes repot event + updates `current_pot_id`

### Phase 7 — Journal
- [ ] Add/edit journal entry (long-form, photos optional)
- [ ] Plant timeline view (events + journal + issues)
- [ ] Global journal feed

### Phase 8 — Issues
- [ ] Create/resolve issue flows
- [ ] Issue timeline + plant context

### Phase 9 — Photos via Vercel Blob signed upload (from SwiftUI)
- [ ] SwiftUI calls Next.js API to get signed upload URL
- [ ] Upload bytes directly to Vercel Blob
- [ ] Save metadata row to Supabase (`plant_photos`)
- [ ] Show photo gallery + timeline integration
