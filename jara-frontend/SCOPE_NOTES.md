# Scope notes

Where the app's UI references a product idea that **isn't** fully modelled
on the backend yet. Nothing fake ever ships — every entry below is either
deferred (not surfaced) or explicitly flagged in-app.

## Deferred: NIN capture in Signup (Phase B)
**Status:** Not surfaced in the UI.
**Why:** `User.js` has `bvn` (11 digits) but no `nin` field, no validator,
no `authService` plumbing. Brief 02 §3.1 says: "add an optional NIN field
in the UI **only if** you also add `nin` to `User.js` + validator +
`authService`; otherwise leave it out". Phase B keeps BVN only and shows
a Tier 2 placeholder card ("coming soon") instead.
**Unlock plan:** when NIN capture becomes a backend story, add
`User.nin` (11-digit validator + encrypted-at-rest TODO), extend
`registerUser` to accept it, then slot the field between BVN and Password
in `Signup.jsx` under the Identity group.

## Deferred: Jara-issued card
**Status:** `LinkedCards.jsx` manages Paystack-tokenised cards. Brief 02
§3.6 says a "Jara card — coming soon" teaser should live on that screen.
**Why:** backend `Card` model only stores linked (external) debit cards;
there is no issuance pipeline.
**Unlock plan:** separate scope (Phase G follow-up); add `IssuedCard`
model + waitlist endpoint.

## Deferred: Device & session list
**Status:** Not surfaced on `SecurityPin.jsx` (Brief 02 §3.10 says "session
list is out of scope").
**Why:** No session store on the backend; refresh tokens aren't tracked
individually.
**Unlock plan:** build a sessions model with revocation; add
`GET /auth/sessions` + `DELETE /auth/sessions/:id`.

## Deferred: Attachments on support tickets
**Status:** `Support.jsx` doesn't accept attachments.
**Why:** `SupportTicket` model has no files field, no object storage wired.

## Deferred: Push / email / SMS channel toggles for notifications
**Status:** `NotificationPrefs.jsx` presents the toggles but only the
"transfer / savings / security / marketing" category axis is persisted.
**Why:** no `NotificationPreference` model; dispatcher doesn't yet
switch on channel.

## Flagged in-app: `TODO(confirm)` claims
Every regulatory, fee, delivery, or stats claim shown as if it were fact
is listed in [`CLAIMS_TO_CONFIRM.md`](CLAIMS_TO_CONFIRM.md). No fake
numbers ship without a Confirm pass.
