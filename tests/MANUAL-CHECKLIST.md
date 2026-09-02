# DIP – Manual Test Checklist

## Pre-Demo Verification

### Auth Flow
- [ ] Navigate to `/` → Landing page renders with hero, features, CTA
- [ ] Click "My account is frozen – Start here" → Redirects to `/auth`
- [ ] Enter email → OTP sent (or guest login available)
- [ ] Complete OTP → Redirects to `/cases`
- [ ] Refresh page → Still authenticated (session persists)
- [ ] Click Logout → Returns to `/`, protected routes inaccessible

### Case Creation
- [ ] Navigate to `/new-case` → 5-step wizard with progress bar
- [ ] Step 1: Leave bank name empty → Error shown
- [ ] Step 1: Fill all required fields → Next works
- [ ] Step 2: Skip all fields (optional) → Next works
- [ ] Step 3: Fill all required fields → Next works
- [ ] Step 3: Upload 2+ evidence files → Files listed with metadata
- [ ] Step 4: Review summary shows all entered data
- [ ] Step 4: Try to submit without consent → Error shown
- [ ] Step 4: Check consent → Submit button enabled
- [ ] Submit → Loading state → Redirects to case detail

### Case List
- [ ] Navigate to `/cases` → Shows created case(s)
- [ ] Empty state shows when no cases exist
- [ ] Click case row → Navigates to case detail
- [ ] Status badge shows correct color (Pending = amber)

### Case Detail
- [ ] Summary card shows bank, account, amount, sender
- [ ] Evidence section lists uploaded files
- [ ] Consistency checks show pass/warning/fail icons
- [ ] JSON report download button works
- [ ] Timeline shows case_created, evidence_uploaded, report_generated events
- [ ] Dispatch tab: Record dispatch → Select targets → Record
- [ ] Escalations tab: New Draft → Select target → Draft auto-populates → Save
- [ ] Responses tab: Record Response → Fill fields → Record
- [ ] Status dropdown: Change to "Resolved" → Updates
- [ ] Add Note → Note appears in timeline

### About Page
- [ ] Navigate to `/about` → All sections render
- [ ] "What DIP is" section visible
- [ ] "What DIP is NOT" section visible
- [ ] Privacy section visible
- [ ] Contact section visible

### Responsive Design
- [ ] Case list: Desktop shows table, mobile shows cards
- [ ] Case detail: Tabs scroll horizontally on mobile
- [ ] New case wizard: Steps compact on mobile
- [ ] Landing page: Hero text readable on mobile

### Disclaimers
- [ ] Landing: "DIP does not certify innocence" visible
- [ ] Landing: "DIP cannot unfreeze accounts" visible
- [ ] Auth: Disclaimer below sign-in card
- [ ] Case intake: Consent step has 4 explicit items
- [ ] Case list: Footer disclaimer
- [ ] Case detail: Footer disclaimer
- [ ] About: Full disclaimers section

### Error States
- [ ] Invalid case ID → "Case not found" message
- [ ] Network error → Toast notification shown
- [ ] Form validation → Inline errors with icons

### Security Quick Checks
- [ ] Try accessing `/cases/invalid-id` → Error, not crash
- [ ] Try accessing `/cases` when logged out → Redirects to auth
- [ ] Check browser console → No sensitive data logged
- [ ] Check page source → No full account numbers visible
