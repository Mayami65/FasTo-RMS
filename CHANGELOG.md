# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-27

### Added
- **Core POS Flow**
    - Seamless checkout logic with a fully functional shoppinng cart interface (`Sales.tsx`).
    - Integrated ability to search, select, and seamlessly add distinct products to active sales.
    - Full transaction logging written directly natively into the encrypted SQLite (`fasto.db`).
- **Inventory Basics**
    - Built comprehensive modules for tracking current stock levels.
    - Complete integration matching real-time POS processing so inventory automatically decrements upon successful checkout.
- **Customer Management**
    - Integrated database hooks enabling staff to assign and save individual Customers (`customer_id`) to every transaction.
    - Enabled specific data schemas representing lifetime customer metrics mapping into long-term history tracking.
- **System Stability & Configuration**
    - Built-in data backup/restore capabilities safely exporting `database.sqlite` via a React-to-Electron IPC bridge.
    - Global "Settings" architecture controlling store receipts and local terminal profiles.
    - Complete "About" section clearly displaying the running version (`v1.0.0`) and database path. 
- **Premium Analytics Engine (v1.0.0 Foundation)**
    - *Executive Overview*: High-level Net Revenue, Gross Profit margins, and Transaction numbers tracking daily performance.
    - *Customer Intelligence*: Retention Health tracking (Repeat vs New Buyers) mapping out VIP Customers by aggregate lifetime spend.
    - *Product Intelligence*: Ranking Top Selling Products against Slow-Moving Inventory and tracking revenue composition across category divisions.
    - *Operational Intelligence*: Staff-specific Cashier Leaderboards and Peak Trading Hour visualizers to monitor the floor flow velocity.

### Changed
- Refactored all "Mock Data" logic out of the initial application layers, replacing it entirely with concrete SQLite query engines and React `useState` hooks communicating over the secure Electron API boundary.
- Stabilized Recharts implementations and UI wrappers blocking fatal DOM nesting exceptions from hidden React tab structures. 

### Fixed
- Fixed bug causing false zero readings on "Today" scoped analytics filtering by aligning JavaScript Date string generation with raw UTC SQLite schema requirements.

## [0.1.0] - Pre-Release
- Initial project scaffolding.
- Basic Electron and Vite compilation scaffolding mapped successfully.
