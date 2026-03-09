# Database Schema

## Tables & Columns

### Auth

#### `users`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| name | varchar | YES | |
| email | varchar | NO | |
| email_verified | boolean | NO | false |
| image | varchar | YES | |
| role | varchar | NO | 'business_user' |
| is_active | boolean | NO | true |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

Roles: `business_user`, `superadmin`, `customer` (B2B2C variant)

#### `sessions`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | NO | |
| user_id | integer (FK → users.id) | NO | |
| token | varchar | NO | |
| expires_at | timestamp | NO | |
| ip_address | varchar | YES | |
| user_agent | text | YES | |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | NO | now() |

#### `accounts`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | NO | |
| user_id | integer (FK → users.id) | NO | |
| account_id | varchar | NO | |
| provider_id | varchar | NO | |
| access_token | text | YES | |
| refresh_token | text | YES | |
| access_token_expires_at | timestamp | YES | |
| refresh_token_expires_at | timestamp | YES | |
| scope | text | YES | |
| id_token | text | YES | |
| password | text | YES | |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | NO | now() |

#### `verification`
| Column | Type | Nullable |
|--------|------|----------|
| id | uuid (PK) | NO |
| identifier | text | NO |
| value | text | NO |
| expires_at | timestamp | NO |
| created_at | timestamp | NO |
| updated_at | timestamp | NO |

---

### Subscriptions

#### `subscription_plans`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| name | varchar | NO | |
| code | varchar | NO | |
| description | text | YES | |
| price | numeric | NO | |
| billing_interval | varchar | NO | |
| trial_period_unit | varchar | YES | |
| trial_period_value | integer | YES | |
| features | jsonb | YES | |
| polar_product_id | varchar | YES | |
| polar_price_id | varchar | YES | |
| monthly_credits | integer | YES | |
| overage_rate | numeric | YES | |
| is_active | boolean | NO | true |
| sort_order | integer | NO | 0 |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

#### `user_subscriptions`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| user_id | integer (FK → users.id) | NO | |
| plan_id | integer (FK → subscription_plans.id) | NO | |
| status | varchar | NO | |
| current_period_start | timestamp | YES | |
| current_period_end | timestamp | YES | |
| canceled_at | timestamp | YES | |
| payment_provider | varchar | YES | 'paypal' |
| provider_subscription_id | varchar | YES | |
| provider_order_id | varchar | YES | |
| trial_end | timestamp | YES | |
| cancel_at_period_end | boolean | NO | false |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |
| deleted_at | timestamp | YES | |

Status values: `active`, `trialing`, `canceled`, `past_due`, `incomplete`

#### `subscription_payments`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| user_id | integer (FK → users.id) | NO | |
| subscription_id | integer (FK → user_subscriptions.id) | NO | |
| paypal_order_id | varchar | NO | |
| amount | numeric | NO | |
| currency | varchar | NO | |
| status | varchar | NO | 'CREATED' |
| billing_period_start | timestamp | NO | |
| billing_period_end | timestamp | NO | |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

#### `user_subscription_logs`
| Column | Type | Nullable |
|--------|------|----------|
| id | integer (PK, serial) | NO |
| subscription_id | integer (FK → user_subscriptions.id) | NO |
| event | varchar | NO |
| metadata | jsonb | YES |
| previous_status | varchar | YES |
| new_status | varchar | YES |
| previous_plan | varchar | YES |
| new_plan | varchar | YES |
| description | text | YES |
| created_at | timestamp | NO |

#### `subscription_plan_features`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| name | varchar | NO | |
| code | varchar | NO | |
| description | text | YES | |
| feature_type | varchar | NO | |
| default_value | jsonb | YES | |
| template | text | YES | |
| is_active | boolean | NO | true |
| sort_order | integer | NO | 0 |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

#### `subscription_plan_feature_values`
| Column | Type | Nullable |
|--------|------|----------|
| id | integer (PK, serial) | NO |
| subscription_plan_id | integer (FK → subscription_plans.id) | NO |
| feature_id | integer (FK → subscription_plan_features.id) | NO |
| value | jsonb | NO |
| created_at | timestamp | NO |
| updated_at | timestamp | NO |

---

### Credits

#### `user_credits`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| user_id | integer (FK → users.id) | NO | |
| balance | integer | NO | 0 |
| included_credits_used | integer | NO | 0 |
| overage_credits_used | integer | NO | 0 |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | NO | now() |

#### `credit_transactions`
| Column | Type | Nullable |
|--------|------|----------|
| id | integer (PK, serial) | NO |
| user_id | integer (FK → users.id) | NO |
| amount | integer | NO |
| type | enum (credit_transaction_type) | NO |
| description | text | YES |
| reference_id | varchar | YES |
| created_at | timestamp | NO |

Transaction types: `purchase`, `deduction`, `grant`, `refund`, `expiry`

#### `credit_packs`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| name | varchar(255) | NO | |
| credits | integer | NO | |
| price | numeric | NO | |
| polar_product_id | varchar(255) | NO | |
| polar_price_id | varchar(255) | YES | |
| is_active | boolean | NO | true |
| expiry_days | integer | YES | |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | NO | now() |

---

### Payments

#### `payment_transactions`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| user_id | integer (FK → users.id) | NO | |
| paypal_order_id | varchar | NO | |
| amount | numeric | NO | |
| currency | varchar(3) | NO | |
| credits | integer | NO | |
| status | varchar | NO | 'CREATED' |
| description | text | YES | |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

---

### API / Webhooks

#### `api_keys`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| user_id | integer (FK → users.id) | NO | |
| key | varchar | NO | |
| name | varchar | NO | |
| is_active | boolean | NO | true |
| permissions | jsonb | YES | |
| requests_count | bigint | NO | 0 |
| last_used_at | timestamp | YES | |
| created_at | timestamp | NO | now() |

#### `webhooks`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| user_id | integer (FK → users.id) | NO | |
| uuid | uuid | NO | uuid_generate_v4() |
| signing_secret | varchar | NO | |
| url | varchar | NO | |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | NO | now() |

#### `webhook_logs`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid (PK) | NO | uuid_generate_v4() |
| provider | varchar(50) | NO | |
| event_type | varchar(255) | NO | |
| webhook_id | varchar(255) | YES | |
| payload | jsonb | NO | |
| headers | jsonb | YES | |
| processed | boolean | NO | false |
| processed_at | timestamp | YES | |
| processing_error | text | YES | |
| retry_count | integer | NO | 0 |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

---

### Projects / Multi-Tenancy

#### `projects`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| uuid | uuid | YES | uuid_generate_v4() |
| user_id | integer (FK → users.id) | NO | |
| title | varchar | NO | |
| slug | varchar | NO | |
| description | text | YES | |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | NO | now() |

#### `project_domain`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| project_id | integer (FK → projects.id) | NO | |
| domain | varchar | NO | |
| added_to_cloudflare | boolean | NO | false |
| dns_verification_status | enum | NO | 'pending' |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

DNS status values: `pending`, `verified`, `failed`

---

### Admin

#### `admin_settings`
| Column | Type | Nullable |
|--------|------|----------|
| key | varchar (PK) | NO |
| value | varchar | NO |
| created_at | timestamp | NO |
| updated_at | timestamp | NO |

#### `user_settings`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | integer (PK, serial) | NO | nextval |
| user_id | integer (FK → users.id) | NO | |
| allow_overage | boolean | NO | true |
| max_overage_credits | integer | YES | |
| theme_mode | varchar(20) | NO | 'light' |
| density | varchar(20) | NO | 'comfortable' |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | NO | now() |

#### `user_businesses` (B2B2C variant)
| Column | Type | Nullable |
|--------|------|----------|
| id | integer (PK, serial) | NO |
| user_id | integer (FK → users.id) | NO |
| business_id | integer | NO |
| created_at | timestamp | NO |
| updated_at | timestamp | NO |

---

## Common Questions → SQL Queries

### Users & Auth

```sql
-- How many users are there?
SELECT COUNT(*) FROM users;

-- How many verified users?
SELECT COUNT(*) FROM users WHERE email_verified = true;

-- How many active users?
SELECT COUNT(*) FROM users WHERE is_active = true;

-- List all users (recent first)
SELECT id, name, email, role, email_verified, created_at FROM users ORDER BY created_at DESC LIMIT 20;

-- How many active sessions?
SELECT COUNT(*) FROM sessions WHERE expires_at > NOW();

-- How many superadmins?
SELECT COUNT(*) FROM users WHERE role = 'superadmin';
```

### Subscriptions

```sql
-- Which subscription plans exist?
SELECT name, code, price, billing_interval, is_active FROM subscription_plans ORDER BY sort_order;

-- What's the most expensive subscription plan?
SELECT name, price FROM subscription_plans ORDER BY price DESC LIMIT 1;

-- How many active subscriptions?
SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active' AND deleted_at IS NULL;

-- Subscriptions by status
SELECT status, COUNT(*) FROM user_subscriptions WHERE deleted_at IS NULL GROUP BY status;

-- Which users have active subscriptions?
SELECT u.email, sp.name AS plan, us.status, us.current_period_end
FROM user_subscriptions us
JOIN users u ON u.id = us.user_id
JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.status = 'active' AND us.deleted_at IS NULL
ORDER BY us.created_at DESC;

-- Recent subscription payments
SELECT * FROM subscription_payments ORDER BY created_at DESC LIMIT 10;

-- Subscription plan feature values for a plan
SELECT sp.name AS plan, spf.code AS feature, spfv.value
FROM subscription_plan_feature_values spfv
JOIN subscription_plans sp ON sp.id = spfv.subscription_plan_id
JOIN subscription_plan_features spf ON spf.id = spfv.feature_id
ORDER BY sp.name, spf.code;
```

### Credits

```sql
-- Credit balance totals (sum and average)
SELECT SUM(balance), AVG(balance), MIN(balance), MAX(balance) FROM user_credits;

-- Users with the most credits
SELECT u.email, uc.balance FROM user_credits uc JOIN users u ON u.id = uc.user_id ORDER BY uc.balance DESC LIMIT 10;

-- Recent credit transactions
SELECT ct.type, ct.amount, ct.description, u.email, ct.created_at
FROM credit_transactions ct
JOIN users u ON u.id = ct.user_id
ORDER BY ct.created_at DESC LIMIT 20;

-- Credit transactions by type
SELECT type, COUNT(*), SUM(amount) FROM credit_transactions GROUP BY type;

-- Which credit packs are available?
SELECT name, credits, price, is_active FROM credit_packs ORDER BY price;
```

### Payments

```sql
-- Recent payments (credit pack purchases)
SELECT pt.amount, pt.currency, pt.credits, pt.status, u.email, pt.created_at
FROM payment_transactions pt
JOIN users u ON u.id = pt.user_id
ORDER BY pt.created_at DESC LIMIT 10;

-- Total revenue from credit packs
SELECT SUM(amount) AS total_revenue, COUNT(*) AS total_transactions
FROM payment_transactions WHERE status = 'COMPLETED';
```

### API & Webhooks

```sql
-- How many active API keys?
SELECT COUNT(*) FROM api_keys WHERE is_active = true;

-- Most used API keys
SELECT name, requests_count, last_used_at FROM api_keys WHERE is_active = true ORDER BY requests_count DESC LIMIT 10;

-- How many unprocessed webhooks?
SELECT COUNT(*) FROM webhook_logs WHERE processed = false;

-- Unprocessed webhook logs
SELECT provider, event_type, retry_count, created_at FROM webhook_logs WHERE processed = false ORDER BY created_at DESC;

-- Webhook logs with errors
SELECT provider, event_type, processing_error, retry_count FROM webhook_logs WHERE processing_error IS NOT NULL ORDER BY created_at DESC LIMIT 10;
```

### Projects

```sql
-- How many projects are there?
SELECT COUNT(*) FROM projects;

-- Projects per user
SELECT u.email, COUNT(p.id) AS project_count FROM projects p JOIN users u ON u.id = p.user_id GROUP BY u.email ORDER BY project_count DESC;
```

### Admin

```sql
-- All admin settings
SELECT key, value FROM admin_settings ORDER BY key;

-- Get a specific admin setting
SELECT value FROM admin_settings WHERE key = 'credits_strategy';
```
