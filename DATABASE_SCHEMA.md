# Database Schema Reference

This file contains the complete database schema for the Money Management application.
Use this as a reference to avoid creating duplicate tables or columns.

## Tables Overview

### 1. `active_trades`
Tracks currently active trades for users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL, FK -> auth.users(id) | |
| entry_session_id | uuid | UNIQUE, FK -> checklist_sessions(id) | |
| exit_session_id | uuid | UNIQUE, FK -> checklist_sessions(id) | |
| entry_time | timestamptz | NOT NULL, DEFAULT now() | |
| exit_time | timestamptz | | |
| status | varchar | NOT NULL, DEFAULT 'active', CHECK ('active', 'completed', 'cancelled') | |
| instrument | varchar | | |
| notes | text | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |
| duration_seconds | integer | | |
| trade_result | varchar | CHECK ('profit', 'loss', NULL) | |
| entry_score | integer | CHECK (0-100 or NULL) | |
| exit_score | integer | CHECK (0-100 or NULL) | |
| symbol | varchar | | |

### 2. `ai_analyses`
Stores AI analysis results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL, FK -> auth.users(id) | |
| analysis_data | jsonb | NOT NULL | |
| model_used | text | NOT NULL | |
| provider | text | NOT NULL | |
| created_at | timestamptz | NOT NULL, DEFAULT timezone('utc', now()) | |

### 3. `app_logs`
Application logging table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | FK -> auth.users(id) | |
| level | text | NOT NULL, CHECK ('info', 'warning', 'error') | |
| message | text | NOT NULL | |
| metadata | jsonb | DEFAULT '{}' | |
| created_at | timestamptz | DEFAULT now() | |

### 4. `checklist_sessions`
Records of checklist completion sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL, FK -> auth.users(id) | |
| type | varchar | NOT NULL, CHECK ('entry', 'exit') | |
| checked_items | jsonb | NOT NULL, DEFAULT '[]' | |
| item_details | jsonb | NOT NULL, DEFAULT '[]' | |
| total_score | integer | NOT NULL, CHECK (0-100) | |
| status | varchar | NOT NULL, CHECK ('completed', 'cancelled', 'saved') | |
| trade_date | date | | |
| notes | text | | |
| created_at | timestamptz | DEFAULT now() | |
| symbol | varchar | | |

### 5. `checklist_templates`
Default checklist items templates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| type | varchar | NOT NULL, CHECK ('entry', 'exit') | |
| name | varchar | NOT NULL | |
| description | text | | |
| weight | integer | NOT NULL, CHECK (0-100) | |
| is_mandatory | boolean | DEFAULT false | |
| is_default | boolean | DEFAULT true | |
| order_index | integer | NOT NULL | |
| category | varchar | | |
| template_name | varchar | DEFAULT 'default' | |
| created_at | timestamptz | DEFAULT now() | |

### 6. `completed_trades`
Historical completed trades data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL, FK -> auth.users(id) | |
| symbol | varchar | NOT NULL | |
| entry_time | timestamptz | NOT NULL | |
| entry_session_id | uuid | FK -> checklist_sessions(id) | |
| entry_score | integer | NOT NULL | |
| entry_checklist_items | jsonb | | |
| exit_time | timestamptz | NOT NULL | |
| exit_session_id | uuid | FK -> checklist_sessions(id) | |
| exit_score | integer | NOT NULL | |
| exit_checklist_items | jsonb | | |
| duration_seconds | integer | NOT NULL | |
| trade_result | varchar | NOT NULL, CHECK ('profit', 'loss') | |
| created_at | timestamptz | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | timestamptz | DEFAULT CURRENT_TIMESTAMP | |

### 7. `payments`
Payment transaction records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | FK -> auth.users(id) | |
| plan_id | uuid | FK -> subscription_plans(id) | |
| amount | numeric | NOT NULL | |
| status | text | NOT NULL | |
| payment_method | text | | |
| transaction_id | text | | |
| created_at | timestamptz | DEFAULT now() | |

### 8. `position_calculations`
Position size calculations history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL, FK -> auth.users(id) | |
| calculation_data | jsonb | NOT NULL | |
| created_at | timestamptz | NOT NULL, DEFAULT timezone('utc', now()) | |

### 9. `site_settings` ⚠️ KEY-VALUE STORE
Global site settings stored as key-value pairs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| key | text | NOT NULL, UNIQUE | Setting key |
| value | jsonb | NOT NULL | Setting value (JSON) |
| category | text | NOT NULL | Setting category |
| updated_at | timestamptz | DEFAULT now() | |
| updated_by | uuid | FK -> auth.users(id) | |

### 10. `subscription_plans`
Available subscription plans.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| name | text | NOT NULL | |
| price | numeric | NOT NULL | |
| features | jsonb | | |
| is_active | boolean | DEFAULT true | |
| created_at | timestamptz | DEFAULT now() | |

### 11. `trading_journal`
Daily trading journal entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL, FK -> auth.users(id) | |
| trade_date | date | NOT NULL | |
| pnl | numeric | DEFAULT 0 | |
| notes | text | | |
| has_traded | boolean | DEFAULT true | |
| created_at | timestamptz | NOT NULL, DEFAULT timezone('utc', now()) | |
| updated_at | timestamptz | NOT NULL, DEFAULT timezone('utc', now()) | |

### 12. `user_checklist_items`
User-customized checklist items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL, FK -> auth.users(id) | |
| type | varchar | NOT NULL, CHECK ('entry', 'exit') | |
| name | varchar | NOT NULL | |
| description | text | | |
| weight | integer | NOT NULL, CHECK (0-100) | |
| is_mandatory | boolean | DEFAULT false | |
| is_active | boolean | DEFAULT true | |
| order_index | integer | NOT NULL | |
| category | varchar | | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 13. `user_profiles` ⚠️ CRITICAL TABLE
User profile information and subscription status.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, FK -> auth.users(id) | |
| full_name | text | | |
| avatar_url | text | | |
| created_at | timestamptz | NOT NULL, DEFAULT timezone('utc', now()) | |
| updated_at | timestamptz | NOT NULL, DEFAULT timezone('utc', now()) | |
| role | user_role | NOT NULL, DEFAULT 'user' | Custom enum type |
| is_subscribed | boolean | DEFAULT false | ⚠️ Controls platform access |
| subscription_start_date | timestamptz | | |
| subscription_end_date | timestamptz | | |
| email | text | UNIQUE | |
| stripe_customer_id | text | UNIQUE | |
| stripe_subscription_id | text | | |
| subscription_status | text | DEFAULT 'inactive' | |
| is_admin | boolean | DEFAULT false | |
| subscription_plan_id | uuid | FK -> subscription_plans(id) | |

### 14. `user_settings`
User-specific settings and API keys.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL, UNIQUE, FK -> auth.users(id) | |
| initial_capital | numeric | DEFAULT 0 | |
| current_balance | numeric | DEFAULT 0 | |
| risk_per_trade | numeric | DEFAULT 1.0 | |
| daily_loss_max | numeric | DEFAULT 3.0 | |
| weekly_target | numeric | DEFAULT 2.0 | |
| monthly_target | numeric | DEFAULT 8.0 | |
| secure_mode | boolean | DEFAULT false | |
| ai_provider | text | DEFAULT 'anthropic' | |
| selected_model | text | DEFAULT 'claude-3-5-sonnet-20241022' | |
| anthropic_api_key | text | | |
| openai_api_key | text | | |
| created_at | timestamptz | NOT NULL, DEFAULT timezone('utc', now()) | |
| updated_at | timestamptz | NOT NULL, DEFAULT timezone('utc', now()) | |
| trading_timezone | text | DEFAULT 'UTC' | |

### 15. `user_statistics`
Aggregated user statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | |
| user_id | uuid | FK -> auth.users(id) | |
| total_trades | integer | DEFAULT 0 | |
| successful_trades | integer | DEFAULT 0 | |
| total_profit_loss | numeric | DEFAULT 0.00 | |
| win_rate | numeric | DEFAULT 0.00 | |
| last_active | timestamptz | DEFAULT now() | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

## Custom Types

### `user_role` (ENUM)
- 'user'
- 'admin'

## Important Notes

1. **Authentication**: Uses Supabase Auth (`auth.users` table)
2. **RLS (Row Level Security)**: Enabled on all tables
3. **Subscription Control**: Access controlled via `user_profiles.is_subscribed`
4. **Site Settings**: Key-value store, NOT column-based
5. **Stripe Integration**: 
   - `stripe_customer_id` in user_profiles
   - `stripe_subscription_id` in user_profiles
   - Webhook updates these fields

## Common Issues & Solutions

### 500 Internal Server Error
Usually caused by:
- Missing user profile record
- NULL required fields in user_profiles
- Empty site_settings table
- RLS policy issues

### Subscription Access
- User must have `is_subscribed = true` in user_profiles
- AuthGuard.jsx checks this field
- Stripe webhook should update this automatically

---
Last Updated: 2025-07-28