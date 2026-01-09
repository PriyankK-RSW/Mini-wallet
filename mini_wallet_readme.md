## Mini Wallet Project – Setup & Usage Guide

---

### Project Setup

Download Zip File from:  
https://github.com/HarshJ-RSW/Mini-wallet/

Install dependencies:

```bash
cd frontend
npm install

cd backend
npm install
```

---

### Environment Setup

Add a `.env` file in the **backend** folder.

```env
PORT=5000

MONGO_URI=mongodb+srv://db1234:Priyank0908@taskmanagement.jqe0s6y.mongodb.net/Mini_wallet?retryWrites=true&w=majority&appName=Taskmanagement

REDIS_HOST=redis-12920.crce217.ap-south-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12920
REDIS_PASSWORD=Na9xbwf8KgObMjOOAddNjzhMfcgX2Olu

STRIPE_WEBHOOK_SECRET=whsec_ea0446b16b333f51c00fd85b369cc30c55fd6b3863bd5e2813a96e035106ede0

JWT_SECRET=8d555cce188ccc395c5b3c08dc361cf2
JWT_EXPIRES_IN=1h

STRIPE_PUBLISHABLEKEY=pk_test_51SmoSiPYNgeGz9MrrvwTXhQBhXOiIP0vf9k2IZ2bJAd9BxmbEmlbivSEXB5iThcS79sPGskP4XVhmNc6U2NPksK000c4zyJYq0
STRIPE_SECRET_KEY=sk_test_51SmoSiPYNgeGz9MrtkOv92sJ9O85DUuz4gQFqlcQAbrlGyPiaWwMKOLZ2A2IyCJJCjQSC3nTzYPztOhnYC8K2Cwx00EXgkjzhk

SALT_ROUNDS=10
```

---

### Basic Wallet Functionality

This project integrates **send and receive money functionality using Wallet ID**.

Each user has:
- a unique wallet ID
- wallet balance
- transaction history

---

### Add Balance Using Stripe (Local Setup Required)

To add balance using Stripe, you must install **Stripe CLI** on your local machine.

Download Stripe CLI from:  
https://github.com/stripe/stripe-cli/releases/tag/v1.34.0

Unzip the file:

```bash
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
```

Login to Stripe CLI:

```bash
./stripe login
```

Start webhook listener:

```bash
./stripe listen --forward-to localhost:5000/wallet/webhook
```

Copy the webhook secret shown in terminal and replace this value in `.env`:

```env
STRIPE_WEBHOOK_SECRET=your_new_webhook_secret
```

Now you can **add balance using Stripe card payments**.

---

## Functionality Guide

### Register Account
- Register using **email, password, and transaction PIN**
- Wallet is automatically created
- Initial balance: **1000**

---

### Login
- Login using **email and password**
- Wallet details and balance are fetched

---

### Wallet Balance & Wallet ID
- Each user has a **wallet ID**
- Wallet ID is required to **send and receive money**

---

### Send Money

To send money:
- Enter receiver **wallet ID**
- Enter **amount**
- Enter your **transaction PIN**
- Confirm send

System will:
- deduct money from sender wallet
- add money to receiver wallet
- create transaction records for both users

---

### Add Balance Using Stripe
- Add balance using **card payment**
- On successful payment:
  - balance is updated
  - transaction is created automatically

---

### Transactions Route

Route:
```
/transaction
```

Available functionality:
- Filter transactions
- Export transactions as **PDF**
- Add transactions using **CSV file**

---

### Add Transactions Using CSV

Sample CSV file  
(Replace `userId` with the account where you want to add transactions):

```csv
userId,amount,type,counterpartyWalletId,createdAt
695cf5233138dd3d6d2ffd6e,1500.00,CREDIT,STRIPE,2025-12-15T10:30:00
695cf5233138dd3d6d2ffd6e,300.50,DEBIT,BANK,2025-12-18T14:45:00
695cf5233138dd3d6d2ffd6e,750.00,CREDIT,STRIPE,2025-12-20T09:15:00
695cf5233138dd3d6d2ffd6e,200.00,CREDIT,60f7b123456789abc0000002,2025-12-22T16:20:00
695cf5233138dd3d6d2ffd6e,200.00,DEBIT,60f7b123456789abc0000001,2025-12-22T16:20:00
695cf5233138dd3d6d2ffd6e,5000.00,CREDIT,STRIPE,2026-01-01T08:00:00
695cf5233138dd3d6d2ffd6e,100.75,DEBIT,BANK,2026-01-05T12:10:00
695cf5233138dd3d6d2ffd6e,1200.00,CREDIT,60f7b123456789abc0000001,2026-01-07T18:45:00
695cf5233138dd3d6d2ffd6e,1200.00,DEBIT,60f7b123456789abc0000003,2026-01-07T18:45:00
695cf5233138dd3d6d2ffd6e,400.00,DEBIT,BANK,2026-01-08T11:30:00
```

