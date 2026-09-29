# Roles and Permissions Matrix

Legend: **Y** allowed, **O** own resources only / permitted relation, **N** denied.

| Capability | Patient | Doctor | Admin | Decision Reference |
|---|:---:|:---:|:---:|---|
| Register own account | Y | N | N | D13 (Patients self-register; Doctors created by Admin) |
| Login / Logout / Change password | Y | Y | Y | D9, D16 |
| Edit own profile | O | O | O | D14 (Admin edits doctor profile fields, not availability) |
| Search & view doctor profiles | Y | Y | Y | Public / authenticated |
| Manage doctor availability | N | O | N | D14 (Doctor configures own; Admin denied) |
| Book appointment | O | N | N | D14 (Patients book own; Admin & Doctor denied) |
| View appointments | O (own) | O (own) | Y (all) | Ownership / RBAC |
| Manage appointment status | O (cancel >=24h) | O (confirm/cancel/complete/no_show) | Y (confirm/cancel/complete/no_show) | D2, D3, D14 |
| Cancel appointment | O (>=24h start) | O (anytime before completed) | Y (anytime before completed) | D3 |
| View medical records | O (own) | O (authored / clinical relation) | N | D6, D15 |
| Create medical record | N | O (authored for confirmed/completed) | N | D6, D19 |
| Modify medical record | N | O (author only) | N | D6, D19 |
| Manage users & toggle status | N | N | Y | D13 |
| Manage doctors & onboarding | N | N | Y | D13, D17 |
| Manage specializations | N | N | Y | Admin RBAC |
| View admin dashboard | N | N | Y | Admin RBAC |
| View in-app notifications | O (own) | O (own) | O (own) | D5 |

---

## Endpoint Access Matrix

| HTTP Method | Endpoint | Public | Patient | Doctor | Admin | Ownership & Authorization Rules |
|---|---|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/config` | Y | Y | Y | Y | Public clinic config (D18). No auth required. |
| `POST` | `/api/auth/register` | Y | N | N | N | Self-registration for Patients only (D13). |
| `POST` | `/api/auth/login` | Y | Y | Y | Y | Returns httpOnly JWT cookie (D16). |
| `POST` | `/api/auth/logout` | Y | Y | Y | Y | Clears httpOnly JWT cookie (D16). |
| `GET` | `/api/auth/me` | N | Y | Y | Y | Returns authenticated identity. |
| `POST` | `/api/auth/change-password` | N | Y | Y | Y | Authenticated user changes own password (D9). |
| `GET` | `/api/specializations` | Y | Y | Y | Y | List active specializations. |
| `POST` | `/api/specializations` | N | N | N | Y | Admin creates specialization. |
| `PUT` | `/api/specializations/:id` | N | N | N | Y | Admin updates specialization. |
| `DELETE` | `/api/specializations/:id` | N | N | N | Y | Admin deactivates specialization. |
| `GET` | `/api/doctors` | Y | Y | Y | Y | List & filter doctors. |
| `GET` | `/api/doctors/:id` | Y | Y | Y | Y | Public doctor profile details. |
| `POST` | `/api/doctors` | N | N | N | Y | Admin creates doctor account + temp password (D13, D17). |
| `PUT` | `/api/doctors/:id` | N | N | O | Y | Doctor edits own profile; Admin edits profile (D14). |
| `GET` | `/api/doctors/:id/availability` | Y | Y | Y | Y | Doctor availability schedule. |
| `PUT` | `/api/doctors/:id/availability` | N | N | O | N | Doctor updates own availability schedule (D14). |
| `GET` | `/api/doctors/:id/available-slots` | Y | Y | Y | Y | Calculates 30-min available slots for date `YYYY-MM-DD` (D1, D7). |
| `GET` | `/api/doctors/:id/patients` | N | N | O | N | Doctor views patients with whom they have a clinical relation (D15). |
| `GET` | `/api/patients` | N | N | N | Y | Admin views patient directory. |
| `GET` | `/api/patients/:id` | N | O | O | Y | Patient views self; Doctor views limited profile (no address) if clinical relation (D15); Admin views full. |
| `PUT` | `/api/patients/:id` | N | O | N | Y | Patient edits own profile; Admin edits. |
| `POST` | `/api/appointments` | N | O | N | N | Patient books own appointment (D2, D14). |
| `GET` | `/api/appointments` | N | O | O | Y | Patient views own; Doctor views assigned; Admin views all. |
| `GET` | `/api/appointments/:id` | N | O | O | Y | Access restricted to appointment participants or admin. |
| `PATCH` | `/api/appointments/:id/status` | N | O (cancel >=24h) | O | Y | State machine transition (D2, D3, D4). |
| `POST` | `/api/medical-records` | N | N | O | N | Doctor creates record for confirmed/completed appointment (D6, D19). |
| `GET` | `/api/medical-records` | N | O | O | N | Patient reads own; Doctor reads authored (D6, D15). |
| `GET` | `/api/medical-records/:id` | N | O | O | N | Patient reads own; Doctor reads authored (D6, D15). |
| `GET` | `/api/patients/:id/medical-records` | N | O | O | N | Patient views own history; Doctor views authored history (D6, D15). |
| `PUT` | `/api/medical-records/:id` | N | N | O | N | Editable only by original doctor author (D6, D19). |
| `GET` | `/api/notifications` | N | O | O | O | Authenticated user views own notifications (D5). |
| `PATCH` | `/api/notifications/:id/read` | N | O | O | O | Mark notification as read. |
| `PATCH` | `/api/notifications/read-all` | N | O | O | O | Mark all notifications as read. |
| `GET` | `/api/admin/dashboard` | N | N | N | Y | Real counts & system activity (D6, D14). |
| `GET` | `/api/admin/users` | N | N | N | Y | Admin lists all system users. |
| `PATCH` | `/api/admin/users/:id/status` | N | N | N | Y | Admin activates/deactivates user account. |
