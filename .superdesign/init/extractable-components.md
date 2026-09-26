# Extractable components

## CourseTopbar

- Source: `jornalismo/js/app.js`
- Category: layout
- Description: Shared public/student header with role-sensitive navigation.
- Extractable props: `currentRoute`, `isAuthenticated`, `hasPaidAccess`, `isTeacher`, `initials`
- Hardcoded: course brand text, navigation labels, route hashes

## MobileDock

- Source: `jornalismo/js/app.js`
- Category: layout
- Description: Four-item authenticated mobile navigation dock.
- Extractable props: `currentRoute`, `isVisible`
- Hardcoded: item labels and hashes

## LessonRow

- Source: `jornalismo/js/app.js`
- Category: basic
- Description: Curriculum lesson row with completion/next state.
- Extractable props: `lessonId`, `title`, `duration`, `objective`, `status`
- Hardcoded: route shape and badge layout

## ProgressCard

- Source: `jornalismo/js/app.js`
- Category: basic
- Description: Completion percentage and cloud/local persistence status.
- Extractable props: `percent`, `completedCount`, `totalCount`, `isCloud`
- Hardcoded: progress labels

## ToolLink

- Source: `jornalismo/js/app.js`
- Category: basic
- Description: External research-tool link with category label.
- Extractable props: `name`, `kind`, `url`, `sameOrigin`
- Hardcoded: open-arrow affordance
