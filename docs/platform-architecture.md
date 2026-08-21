# SSA Platform Events Architecture

## Reports

All student and instructor reports use the `reports` collection.

Each report receives a human-readable case ID:

`SSA-RPT-YYYYMMDDHHMMSS-XXXXX`

Core fields:

- `reportId`
- `reporterId`
- `reporterName`
- `reporterEmail`
- `reportedUserId`
- `courseId`
- `category`
- `type`
- `priority`
- `status`
- `description`
- `feedback`
- `moderatorNotes`
- `reviewedBy`
- `createdAt`
- `updatedAt`

Lifecycle: `pending -> reviewing -> resolved|dismissed -> closed`.

Admin and Founder use the existing Reports & Moderation center. The reporter receives a notification whenever the case is reviewed or feedback is added.

## Notifications

The platform uses one logical `notifications` collection. Notifications can target:

- one user
- a role (`student`, `instructor`, `admin`, `founder`)
- a course
- everyone

For compatibility during migration, user notifications carry both `userId` and `recipientId`.

Important metadata belongs in `metadata`, keeping the top-level document stable as the platform grows.

Recommended event types:

- `enrollment`
- `payment`
- `earning`
- `course`
- `lesson`
- `assignment`
- `quiz`
- `report`
- `moderation`
- `system`
- `announcement`
- `maintenance`

## Notification flow

Payment succeeds -> enrollment is created -> student gets enrollment confirmation -> instructor gets new-student notification -> leadership can receive a financial activity notification.

Instructor publishes a lesson/course/assignment/quiz -> students enrolled in that course receive a course-scoped notification.

Student/instructor submits a report -> Admin + Founder receive a moderation notification -> reviewer updates the report -> reporter receives feedback notification.

## Realtime delivery

`js/notification-runtime.js` provides a shared realtime listener, unread handling and a sound hook. Notification sound is disabled with:

`localStorage.setItem("ssa_notification_sound", "off")`

The default is enabled. Sound generation is intentionally kept in the client runtime so a future branded sound file can replace the Web Audio fallback without changing the event model.

## Scaling rules

1. Business events create notifications; portal pages only render them.
2. Keep notification payloads small and put optional data in `metadata`.
3. Use stable event IDs/idempotency keys for backend triggers so retries do not duplicate notifications.
4. Paginate notification/report lists instead of loading the whole collection.
5. Keep Admin and Founder moderation actions auditable.
6. Move event creation to Firebase Functions for trusted server-side events such as payments and enrollments.
