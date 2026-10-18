# FitPulse features

| Feature                    | What it does                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud accounts             | Supabase verifies linked account passwords and stores profiles and role assignments. Admin, staff, and member permissions still apply in the API.              |
| Temporary member passwords | Account creation shows a generated password once. Passwords are hashed, and members must change the temporary password before accessing other features.        |
| Short member codes         | Member records show a readable `FP-` code while UUIDs continue linking attendance, payments, photos, and membership records.                                   |
| Welcome email              | When SMTP is configured, new members receive their temporary sign-in details. The admin can still deliver the one-time password if email delivery fails.       |
| Password recovery          | Verified one-use recovery links let account owners choose and confirm a new password. Old FitPulse sessions are invalidated.                                   |
| QR pass download           | Members can save a branded PNG of their existing QR. The pass shows status and exact Manila expiry; downloading does not issue a new QR or extend access.      |
| Membership-bound QR        | Weekly is ₱200 for 7 days. Other plans use their own duration. The entrance API rejects expired, inactive, suspended, and password-change-pending memberships. |
| Clearer record tables      | One member search, sortable headers, row-count controls, readable status labels, icon view actions, and mobile card layouts simplify record review.            |
| Dashboard shortcuts        | Real counts, renewal/inspection reminders, first-login status, and recent check-ins lead directly to the relevant admin sections.                              |
| Payment monitoring         | Staff record Cash/GCash transactions and export CSV files. FitPulse records payments already made; it does not process online payments.                        |

See [Supabase setup and migration](SUPABASE.md) for cloud-account configuration and
the current local-storage boundaries. A downloaded QR image always remains subject
to the scanner's server-side membership check.
