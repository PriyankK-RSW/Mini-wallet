💳 Mini Digital Wallet / Payment System

(Backend-focused, small scale, production-inspired)

🎯 What This Project Is

This project is a secure digital wallet backend that allows:

users to store balance

send money to other users

protect transactions using a PIN

prevent duplicate payments using Redis

maintain a transaction ledger

⚠️ No real money, no bank integration — only concepts.

🧠 Why This Project Exists (Real-World Problem)

In payment systems:

networks fail

clients retry requests

servers can crash

money must never be deducted twice

This project focuses on correctness and safety, not UI.

🧩 FUNCTIONALITY (WHAT THE SYSTEM DOES)
1️⃣ User Registration
What happens

User creates an account with:

email

password

transact    ion PIN

Internally

Password is hashed using bcrypt

PIN is hashed separately

Unique wallet ID is generated (UPI-like)

Wallet is created with balance = 0

Why it matters

Password = access control

PIN = payment authorization (real wallets do this)

2️⃣ User Login
What happens

User logs in using email + password

Internally

Password hash is verified

JWT token is generated

JWT is used for all future requests

Why JWT

Stateless authentication

Scales well

No session storage required

3️⃣ Wallet System

Each user has:

exactly one wallet

a balance

a wallet ID (used to receive money)

Wallet is not directly editable.

4️⃣ Send Money (CORE FEATURE)

This is the most important functionality.

API
POST /wallet/transfer

User provides

receiver wallet ID

amount

transaction PIN

idempotency key

🔗 INTERNAL CHAIN OF ACTION (MOST IMPORTANT)

This shows how all technologies work together 👇

Step 1: Authentication

JWT middleware validates user

Identifies sender

Step 2: PIN Validation

PIN is compared with stored hash

If incorrect → request rejected immediately

Why early?

Cheap validation

Prevents unnecessary DB/Redis usage

Step 3: Redis Idempotency Check

Redis ensures same payment is not processed twice.

SET txn:<key> processing NX EX 30

If key already exists → duplicate request → reject

Why Redis?

Very fast

Shared across instances

Auto-expires

Step 4: MongoDB Transaction (Atomicity)

MongoDB session is started.

Inside transaction:

Sender wallet is debited

Receiver wallet is credited

Two transaction records are created

If any step fails:

MongoDB rolls back everything

Why this matters:

Money transfer must be all-or-nothing

Step 5: Commit & Finalize

MongoDB transaction committed

Redis key updated to completed

Response returned to client

5️⃣ Transaction Ledger

Every transfer creates:

1 DEBIT record

1 CREDIT record

Transactions are:

immutable

timestamped

queryable

Why ledger?

Audit trail

Balance verification

Debugging & trust

6️⃣ Transaction History

User can:

GET /transactions


Returns:

sent transactions

received transactions

sorted by date

🧰 TECHNOLOGY USED (AND WHY)
🟢 Node.js + Express

Fast API server

Non-blocking I/O

Industry standard

🟢 MongoDB + Mongoose

Used for:

users

wallets

transactions

Why MongoDB?

Flexible schema

Easy to model wallets & transactions

Supports ACID transactions using sessions

🟢 MongoDB Transactions (CRITICAL)

Used for:

safe balance transfer

atomic debit + credit

Without this → payment system is unsafe.

🔴 Redis

Used only for idempotency

Purpose:

prevent duplicate transaction execution

handle client retries safely

Why not DB?

Redis is faster

TTL support

Shared lock across instances

🔐 JWT (JSON Web Tokens)

Used for:

authentication

protecting wallet APIs

Why JWT?

Stateless

Scalable

Easy to integrate

🔐 bcrypt

Used for:

hashing passwords

hashing transaction PIN

Why hashing?

Never store secrets in plain text

Industry security standard

