# CC1 — Control Environment

## Control statement
Management establishes structures, reporting lines, and responsibility for security of the SUPERIOR AI platform.

## How addressed in product
- Organization + role model: `owner | admin | member | viewer` (`@superior-ai/auth`)
- Org invites with explicit acceptance
- Audit events for admin/config actions

## Evidence to collect
| ID | Artifact | Owner | Location / link |
|----|----------|-------|-----------------|
| CC1-1 | Security policy (approved) | [SECURITY_LEAD] | [LINK] |
| CC1-2 | Org chart / RACI for platform | [ENG_MANAGER] | [LINK] |
| CC1-3 | Screenshot of RBAC roles | [ENG] | Auth package / Admin UI |
| CC1-4 | Board/leadership review minutes | [CTO] | [LINK] |

## Test procedure
1. Confirm only `owner`/`admin` can manage providers and billing.  
2. Attempt forbidden action as `viewer` → expect deny + audit `auth.forbidden`.  

## Period
[START_DATE] – [END_DATE]
