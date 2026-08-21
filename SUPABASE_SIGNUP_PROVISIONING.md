# Supabase signup provisioning

Firebase Auth remains the authentication source. `js/signup.js` now mirrors email and Google signups into Supabase:

- `profiles.firebase_uid` links the Firebase account.
- `profiles.id` remains a Supabase UUID.
- Student accounts create/update `students` using the profile UUID.
- Instructor accounts create/update `instructors` using the profile UUID.
- Existing Supabase profiles are updated instead of duplicated.
- Google signup uses the same provisioning path and remains a student signup in the current UI.
