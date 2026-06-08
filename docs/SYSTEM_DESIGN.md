# 📐 Edunova System Design & Core Workflows

This document provides a comprehensive overview of the architectural design, stream dynamics, and operational data flows in the Edunova ERP ecosystem using clean ASCII visual diagrams.

---

## 🏗️ 1. Complete System Architecture Topography

Edunova relies on a robust reactive design powered by a high-performance **React 19** frontend, structured **TypeScript** database services, and a resilient, real-time-subscribed **Supabase client** layer. 

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             USER VIEW & APPLICATION LAYER                        │
│            (Interactive Portals: Admin, Accounts, VP, Students, Teachers)         │
├──────────────────────────────────────────────────────────────────────────────────┤
│    [Tailwind CSS v4 Engine] ◄───► [Motion Smooth Transitions & Interactive State] │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          SERVICES & API CONTROLLER ORCHESTRA                     │
│                        (TypeScript Interfaces & Functional Calls)                │
├──────────────────────────────────────────────────────────────────────────────────┤
│    [supabase.ts Connection]                                                      │
│    - RLS Evaluators                                                              │
│    - Real-time Checkpoints                                                       │
│    - Invoices, Ledgers & Attendance Sync Logs                                    │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼ (Websocket Channels & PG Client Event Streams)
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE POSTGRESQL CLOUD DATABASE                    │
│  - students         - teachers       - attendance       - scheme_of_study        │
│  - grades           - expenses       - income           - timetable              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 2. Student Admission & Enrolment Ingestion Pipeline

When a campus admission officer registers a new candidate via the **Quick Register** tab in the Registrar or Accounts portal, the system triggers the following data flow validation path:

```
                  ┌───────────────────────────────────────────────┐
                  │   Start: Admission Officer inputs Student     │
                  │   Details (SSC percentage, photo, fees, etc.)  │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                         [ SSC % > 0 (e.g. Matric Marks)? ]
                                ╱                   ╲
                        (Yes)  ╱                     ╲ (No)
                              ▼                       ▼
    ┌──────────────────────────────────┐      ┌─────────────────────────┐
    │ Auto-evaluate placement:         │      │ Prompt user for manual  │
    │ getSuggestedSection(pct)         │      │ Section allocation      │
    └─────────────────┬────────────────┘      └────────────┬────────────┘
                      │                                    │
                      └─────────────────┬──────────────────┘
                                        │
                                        ▼
                  ┌───────────────────────────────────────────────┐
                  │ Prepare Payment Installment Schedule Arrays   │
                  │ (Calculate customized installments, extra fees  │
                  │ like welcome party, uniform charges, RFID card)│
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │ Insert Row into admission_forms table │
                      │        (Set Status = "Pending")        │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │ Principal / VP views Admissions List, reviews │
                  │ the dossiers and clicks "Confirm to DB"       │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          Database Sync Engine:         │
                      │ 1. Set admission_forms as "Approved"   │
                      │ 2. Create student record with ID &     │
                      │    allocated Class / Section           │
                      │ 3. Create Fee Ledger records           │
                      └────────────────────────────────────────┘
```

---

## ⏱️ 3. Biometric Check-In & Live Notifications Loop

This system connects student hardware biometric gates directly into the campus command center. Here is how check-ins are logged and broadcasted in real-time:

```
               ┌────────────────────────────────────────────────┐
               │ Student walks through a Biometric Check-In Gate│
               └───────────────────────┬────────────────────────┘
                                       │
                                       ▼ Scan Verified
               ┌────────────────────────────────────────────────┐
               │ Trigger INSERT into "attendance" table with    │
               │   roll_no, status = Present/Late, check-in time│
               └───────────────────────┬────────────────────────┘
                                       │
                                       ▼
               ┌────────────────────────────────────────────────┐
               │   Supabase Postgres Change Subscription Fires  │
               └───────────────────────┬────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼ Real-time Push Callback             ▼ UI Render Channel
        ┌───────────────────────┐             ┌─────────────────────────┐
        │ VP Portal Updates:    │             │   Student Dashboard:    │
        │ - Appends gate logs   │             │   - Instantly shows     │
        │ - Flashes alert banner│             │     Present/Late tag    │
        │                       │             │   - Awards +10 Gamer XP  │
        └───────────────────────┘             └─────────────────────────┘
```

---

## 🏛️ 4. Registrar & Accountant Financial Ledger Engine

The multi-tier general ledger enforces accounting constraints across student fees, employee salaries, operational invoices, and general expenses.

```
                      STUDENT OUTSTANDING DISBURSEMENT TRACKING
                      
                       Student Contracted Total Package Price
                                         │
                                         ▼
                            [ Apply Discount Waivers? ]
                                   ╱          ╲
                           (Yes)  ╱            ╲ (No / Default)
                                 ▼              ▼
                     Subtract concession     No reduction apply
                     discount allocations  
                                 │              │
                                 └──────┬───────┘
                                        │
                                        ▼
                  Calculate installable Total Fees Matrix (Net Due)
                                        │
                      ┌─────────────────┴─────────────────┐
                      ▼                                   ▼
          Cash payment received?              Installment Day past?
                      │                                   │
                      ▼                                   ▼
          Accounts Portal Action:                         │
          - Update "paid_amount"              Generate Outstanding /
          - Record Transaction Invoice           Late Fines alert inside
          - Generate print slip receipt          portal ledgers page
```

---

*Verified Architectural Design and Topology Manual for Edunova Systems © 2026.*
