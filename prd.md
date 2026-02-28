# Product Requirements Document (PRD)

## Product Name: Dee's Joy Retail Management System (DJRMS)
## Version: 2.0 (Operational-First Architecture)

## 1. Product Overview

### 1.1 Purpose

The Dee's Joy Retail Management System (DJRMS) is an offline-first desktop application designed to manage the daily operations of Dee's Joy Ventures, including:

- Inventory management
- Point of sale (POS)
- Hire purchase (installment sales)
- Reporting
- Audit and accountability

The system is optimized for a single shop PC, with the Shop Representative acting as the primary system operator and the Owner serving as a supervisory authority.

### 1.2 Objectives

- Digitize all shop transactions
- Eliminate manual record-keeping errors
- Ensure accurate stock tracking
- Properly manage hire purchase balances
- Generate reliable daily reports
- Enforce accountability through audit logging

### 1.3 System Philosophy

This system is designed around real-world retail operations:

- The Shop Representative handles all daily activities
- The Owner oversees and verifies activities
- The system enforces accountability automatically

## 2. User Roles and Permissions

### 2.1 Shop Representative (Primary Operator)

This user performs nearly all operational tasks.

#### Permissions

- Create and complete sales
- Process refunds (logged)
- Add/edit products
- Restock inventory
- Adjust stock (reason required)
- Create hire purchase agreements
- Record installment payments
- Generate reports
- Perform end-of-day closing
- Print receipts
- View customer records

#### Restrictions

- Cannot delete historical transactions
- Cannot delete audit logs
- Cannot modify past closed-day records
- Cannot alter past hire purchase contracts (after confirmation)

### 2.2 Owner (Supervisory Role)

The Owner does not manage daily operations but oversees and enforces accountability.

#### Permissions

- View all reports
- View full audit logs
- Review refunds
- Review stock adjustments
- Lock/unlock user accounts
- Modify system rules
- Access historical data
- Export financial summaries

## 3. Technical Architecture

### Platform

Desktop application

### Technology Stack

- Tauri (desktop framework)
- React (frontend UI)
- SQLite (local database)
- Local automatic backups
- Optional cloud backup (non-realtime)

### Requirements

- Fully operational without internet
- Fast performance on mid-level Windows PC
- Secure local database storage

## 4. Functional Requirements

### 4.1 Dashboard Module

#### Purpose

Provide operational overview.

#### Features

- Today's total sales
- Total transactions
- Cash collected today
- Mobile money collected
- Hire purchase payments collected
- Outstanding hire purchase balance
- Overdue accounts count
- Low stock alerts
- Quick action buttons

### 4.2 Inventory Module

#### 4.2.1 Product Management

##### Fields

- Product name
- SKU/barcode
- Category
- Cost price
- Selling price
- Stock quantity
- Reorder level
- Description (optional)

##### Features

- Add/edit products
- Search and filter
- Barcode scanning
- Stock history tracking

#### 4.2.2 Stock Management

##### Features

- Stock-in (restock)
- Stock adjustment (damage/loss)
- Automatic deduction on sale
- Stock movement logs
- Low stock alerts

##### Rules

- Stock cannot go negative
- All stock adjustments must require a reason
- All stock adjustments are logged

### 4.3 POS Module

#### 4.3.1 Sales Processing

##### Features

- Fast product search
- Barcode scanning
- Add to cart
- Quantity adjustments
- Discounts (logged)
- Multiple payment methods:
  - Cash
  - Mobile money
  - Bank/card
- Receipt printing
- Save transaction

#### 4.3.2 Refunds

##### Features

- Transaction lookup
- Partial or full refund
- Automatic stock reversal
- Mandatory reason field
- Logged under audit system

#### 4.3.3 End-of-Day Closing

##### Critical Feature

At closing time, the system calculates:

- Total sales
- Total refunds
- Breakdown by payment method
- Hire purchase payments collected
- Expected cash balance

The Shop Representative confirms and closes the day.

The system generates:

- Daily sales report (PDF)
- Cash reconciliation summary
- Timestamped closing record

After closing:

- No editing of that day's transactions allowed

### 4.4 Hire Purchase Module

#### 4.4.1 Customer Management

##### Fields

- Full name
- Phone number
- Address (optional)
- ID reference (optional)

##### Features

- Customer transaction history
- Outstanding balance view

#### 4.4.2 Hire Purchase Creation

##### Fields

- Selected product(s)
- Total price
- Down payment
- Installment frequency
- Payment schedule
- Due dates

##### System Actions

- Deduct stock immediately
- Generate contract record
- Store schedule
- Calculate outstanding balance

#### 4.4.3 Installment Tracking

##### Features

- Record payment
- Auto-update balance
- Display next due date
- Flag overdue accounts
- Print payment receipt

### 4.5 Reporting Module

#### 4.5.1 Daily Sales Report

Includes:

- Total revenue
- Payment breakdown
- Discounts
- Refunds
- Transaction count

#### 4.5.2 Inventory Report

- Current stock levels
- Low stock items
- Stock valuation (cost-based)

#### 4.5.3 Hire Purchase Report

- Total outstanding balances
- Overdue balances
- Payments collected today
- Active contracts

### 4.6 Audit and Accountability Module

#### Mandatory Logging

- Sales creation
- Refunds
- Product edits
- Price changes
- Stock adjustments
- Hire purchase creation
- Installment edits
- User logins
- End-of-day closing

Each log must include:

- User
- Timestamp
- Action
- Affected record
- Before/after values (for edits)

Audit logs:

- Cannot be deleted
- Can only be viewed by Owner (full access)

## 5. Data Safety and Backup

### Requirements

- Automatic daily database backup
- Manual backup option
- Backup file timestamped
- Optional cloud backup when internet is available
- Restore-from-backup feature

## 6. User Experience Requirements

- Large POS buttons
- Minimal clicks for checkout
- Clear visual alerts for overdue and low stock
- Clean interface
- High-contrast readable fonts

Speed and reliability take priority over visual complexity.

## 7. Constraints

- Single shop PC
- No dedicated server
- Must work offline
- Must not rely on cloud uptime

## 8. Acceptance Criteria

The system is complete when:

- Sales automatically reduce inventory
- Hire purchase balances calculate correctly
- Overdue accounts are flagged
- End-of-day closing locks transactions
- Audit logs capture all sensitive actions
- Daily reports generate correctly
- Backup and restore functions work reliably

## 9. Future Enhancements (Phase 2)

- SMS reminders for overdue accounts
- Owner remote dashboard
- Expense tracking module
- Multi-user expansion
- Multi-branch support