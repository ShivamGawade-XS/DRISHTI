"""
DRISHTI — Synthetic UPI Transaction Data Generator
===================================================

Generates 50,000+ synthetic UPI transactions with realistic fraud patterns.
Outputs to ml/data/transactions_raw.csv

Fraud Types (≈5% total):
  - OTP_RELAY
  - SCREEN_SHARE
  - MULE_FUNNEL
  - SOCIAL_ENG_GIFT
  - SLEEPING_MULE
  - KYC_IMPERSONATION

User Cohorts:
  student, trader, homemaker, merchant, salaried
"""

from __future__ import annotations

import os
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from faker import Faker

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
NUM_TRANSACTIONS: int = 55_000
FRAUD_RATE: float = 0.05
SEED: int = 42
OUTPUT_DIR: Path = Path(__file__).resolve().parent / "data"
OUTPUT_FILE: Path = OUTPUT_DIR / "transactions_raw.csv"

BANK_HANDLES: list[str] = [
    "okaxis", "ybl", "paytm", "okhdfcbank", "oksbi",
    "ibl", "apl", "axl", "icici", "upi",
]

INDIAN_CITIES: dict[str, tuple[float, float]] = {
    "Mumbai":       (19.0760, 72.8777),
    "Delhi":        (28.7041, 77.1025),
    "Bangalore":    (12.9716, 77.5946),
    "Hyderabad":    (17.3850, 78.4867),
    "Chennai":      (13.0827, 80.2707),
    "Kolkata":      (22.5726, 88.3639),
    "Pune":         (18.5204, 73.8567),
    "Ahmedabad":    (23.0225, 72.5714),
    "Jaipur":       (26.9124, 75.7873),
    "Lucknow":      (26.8467, 80.9462),
    "Chandigarh":   (30.7333, 76.7794),
    "Kochi":        (9.9312,  76.2673),
    "Bhopal":       (23.2599, 77.4126),
    "Indore":       (22.7196, 75.8577),
    "Nagpur":       (21.1458, 79.0882),
}

COHORT_PROFILES: dict[str, dict[str, Any]] = {
    "student": {
        "amount_mu": 5.5, "amount_sigma": 1.0,
        "txn_per_day_mean": 3, "night_prob": 0.25,
        "weight": 0.20,
    },
    "salaried": {
        "amount_mu": 7.0, "amount_sigma": 1.2,
        "txn_per_day_mean": 4, "night_prob": 0.10,
        "weight": 0.30,
    },
    "merchant": {
        "amount_mu": 8.0, "amount_sigma": 1.5,
        "txn_per_day_mean": 15, "night_prob": 0.05,
        "weight": 0.15,
    },
    "trader": {
        "amount_mu": 9.0, "amount_sigma": 1.8,
        "txn_per_day_mean": 8, "night_prob": 0.15,
        "weight": 0.15,
    },
    "homemaker": {
        "amount_mu": 6.0, "amount_sigma": 0.9,
        "txn_per_day_mean": 2, "night_prob": 0.08,
        "weight": 0.20,
    },
}

FRAUD_TYPES: list[str] = [
    "OTP_RELAY",
    "SCREEN_SHARE",
    "MULE_FUNNEL",
    "SOCIAL_ENG_GIFT",
    "SLEEPING_MULE",
    "KYC_IMPERSONATION",
]

# Fraud-type distribution weights (sum to 1)
FRAUD_TYPE_WEIGHTS: list[float] = [0.25, 0.20, 0.15, 0.15, 0.10, 0.15]

MCC_CODES: list[str] = [
    "5411", "5812", "5311", "4121", "5999",
    "7311", "6012", "4814", "5691", "5942",
]

FESTIVAL_DATES: list[str] = [
    "2025-10-20", "2025-10-21", "2025-10-22",  # Diwali window
    "2025-11-01",                                # Bhai Dooj
    "2025-08-15",                                # Independence Day
    "2025-01-26",                                # Republic Day
    "2025-03-14",                                # Holi
    "2025-04-14",                                # Baisakhi
]


def set_seeds(seed: int = SEED) -> None:
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)


def generate_users(fake: Faker, n_users: int = 3_000) -> pd.DataFrame:
    """Generate a pool of synthetic UPI users with cohort assignments."""
    cohort_names = list(COHORT_PROFILES.keys())
    cohort_weights = [COHORT_PROFILES[c]["weight"] for c in cohort_names]

    users: list[dict[str, Any]] = []
    for _ in range(n_users):
        first = fake.first_name()
        last = fake.last_name()
        full_name = f"{first} {last}"
        handle = random.choice(BANK_HANDLES)
        upi_id = f"{first.lower()}{last.lower()}{random.randint(1,99)}@{handle}"
        cohort = np.random.choice(cohort_names, p=cohort_weights)
        city = random.choice(list(INDIAN_CITIES.keys()))
        lat, lon = INDIAN_CITIES[city]
        # Jitter location slightly
        lat += np.random.normal(0, 0.02)
        lon += np.random.normal(0, 0.02)

        device_id = str(uuid.uuid4())[:12]
        # Account creation date: 1–730 days ago
        account_age_days = random.randint(1, 730)

        users.append({
            "user_id": str(uuid.uuid4()),
            "name": full_name,
            "upi_id": upi_id,
            "cohort": cohort,
            "city": city,
            "home_lat": round(lat, 4),
            "home_lon": round(lon, 4),
            "primary_device_id": device_id,
            "account_age_days": account_age_days,
        })

    return pd.DataFrame(users)


def _generate_timestamp(
    base_date: datetime,
    cohort: str,
    is_fraud: bool,
) -> datetime:
    """Generate a transaction timestamp, skewing to night for fraud."""
    profile = COHORT_PROFILES[cohort]
    if is_fraud and random.random() < 0.55:
        # Fraud skews to late-night / early-morning
        hour = random.choice(list(range(0, 6)) + [23, 22])
    elif random.random() < profile["night_prob"]:
        hour = random.randint(22, 23) if random.random() < 0.5 else random.randint(0, 5)
    else:
        hour = random.randint(6, 21)

    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    day_offset = random.randint(0, 89)  # 90-day window
    ts = base_date - timedelta(days=day_offset, hours=-hour, minutes=minute, seconds=second)
    return ts


def _generate_amount(cohort: str, is_fraud: bool, fraud_type: str | None) -> float:
    """Generate transaction amount with lognormal distribution."""
    profile = COHORT_PROFILES[cohort]
    mu = profile["amount_mu"]
    sigma = profile["amount_sigma"]

    if is_fraud:
        if fraud_type in ("MULE_FUNNEL", "SOCIAL_ENG_GIFT"):
            # Higher amounts for these fraud types
            mu += 2.0
            sigma += 0.5
        elif fraud_type == "SLEEPING_MULE":
            # Small but many amounts
            mu -= 1.0
        elif fraud_type in ("OTP_RELAY", "KYC_IMPERSONATION"):
            mu += 1.5

    raw = np.random.lognormal(mean=mu, sigma=sigma)
    # Clip to realistic UPI range
    amount = np.clip(raw, 1.0, 200_000.0)
    return round(float(amount), 2)


def generate_transactions(users_df: pd.DataFrame) -> pd.DataFrame:
    """Generate the full transaction dataset with fraud injection."""
    fake = Faker("en_IN")
    base_date = datetime(2025, 11, 15)

    n_fraud = int(NUM_TRANSACTIONS * FRAUD_RATE)
    n_legit = NUM_TRANSACTIONS - n_fraud

    # Select fraud senders (some users are victims, some are mules)
    fraud_user_indices = np.random.choice(len(users_df), size=n_fraud, replace=True)

    transactions: list[dict[str, Any]] = []
    beneficiary_pool: list[str] = [
        f"{fake.first_name().lower()}{fake.last_name().lower()}{random.randint(1,99)}@{random.choice(BANK_HANDLES)}"
        for _ in range(500)
    ]

    # --- Generate legitimate transactions ---
    for i in range(n_legit):
        user = users_df.iloc[random.randint(0, len(users_df) - 1)]
        cohort = user["cohort"]
        ts = _generate_timestamp(base_date, cohort, is_fraud=False)
        amount = _generate_amount(cohort, is_fraud=False, fraud_type=None)

        # Beneficiary: mostly from pool (repeat), sometimes new
        if random.random() < 0.15:
            ben_name = fake.first_name().lower() + fake.last_name().lower()
            beneficiary_upi = f"{ben_name}{random.randint(1,99)}@{random.choice(BANK_HANDLES)}"
        else:
            beneficiary_upi = random.choice(beneficiary_pool)

        city = user["city"]
        lat, lon = user["home_lat"], user["home_lon"]
        # Small jitter for location
        lat += np.random.normal(0, 0.005)
        lon += np.random.normal(0, 0.005)

        transactions.append({
            "txn_id": str(uuid.uuid4()),
            "timestamp": ts.isoformat(),
            "sender_upi_id": user["upi_id"],
            "sender_name": user["name"],
            "sender_user_id": user["user_id"],
            "beneficiary_upi_id": beneficiary_upi,
            "amount": amount,
            "currency": "INR",
            "device_id": user["primary_device_id"],
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "city": city,
            "cohort": cohort,
            "account_age_days": user["account_age_days"],
            "mcc_code": random.choice(MCC_CODES),
            "is_fraud": 0,
            "fraud_type": "NONE",
        })

    # --- Generate fraudulent transactions ---
    for idx, user_idx in enumerate(fraud_user_indices):
        user = users_df.iloc[user_idx]
        cohort = user["cohort"]
        fraud_type = np.random.choice(FRAUD_TYPES, p=FRAUD_TYPE_WEIGHTS)
        ts = _generate_timestamp(base_date, cohort, is_fraud=True)
        amount = _generate_amount(cohort, is_fraud=True, fraud_type=fraud_type)

        # Fraud-specific patterns
        new_device = str(uuid.uuid4())[:12] if random.random() < 0.65 else user["primary_device_id"]
        new_beneficiary = f"{fake.first_name().lower()}{random.randint(100,999)}@{random.choice(BANK_HANDLES)}"

        # Location anomaly for fraud
        if random.random() < 0.40:
            fraud_city = random.choice(list(INDIAN_CITIES.keys()))
            lat, lon = INDIAN_CITIES[fraud_city]
            lat += np.random.normal(0, 0.1)
            lon += np.random.normal(0, 0.1)
        else:
            fraud_city = user["city"]
            lat, lon = user["home_lat"], user["home_lon"]
            lat += np.random.normal(0, 0.01)
            lon += np.random.normal(0, 0.01)

        transactions.append({
            "txn_id": str(uuid.uuid4()),
            "timestamp": ts.isoformat(),
            "sender_upi_id": user["upi_id"],
            "sender_name": user["name"],
            "sender_user_id": user["user_id"],
            "beneficiary_upi_id": new_beneficiary,
            "amount": amount,
            "currency": "INR",
            "device_id": new_device,
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "city": fraud_city,
            "cohort": cohort,
            "account_age_days": user["account_age_days"],
            "mcc_code": random.choice(MCC_CODES),
            "is_fraud": 1,
            "fraud_type": fraud_type,
        })

    df = pd.DataFrame(transactions)
    # Sort by timestamp for realism
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


def inject_velocity_bursts(df: pd.DataFrame) -> pd.DataFrame:
    """Inject high-velocity bursts for some fraud transactions.

    For MULE_FUNNEL and OTP_RELAY frauds, create rapid-fire clusters
    by duplicating timestamps with small offsets.
    """
    fraud_mask = df["is_fraud"] == 1
    velocity_fraud_types = ["MULE_FUNNEL", "OTP_RELAY"]
    velocity_mask = fraud_mask & df["fraud_type"].isin(velocity_fraud_types)
    velocity_indices = df[velocity_mask].index.tolist()

    burst_rows: list[dict[str, Any]] = []
    n_bursts = min(len(velocity_indices), 200)
    selected = random.sample(velocity_indices, k=n_bursts) if len(velocity_indices) > n_bursts else velocity_indices

    for idx in selected:
        row = df.loc[idx].to_dict()
        # Add 2-4 rapid follow-up transactions within minutes
        n_rapid = random.randint(2, 4)
        for j in range(n_rapid):
            new_row = row.copy()
            new_row["txn_id"] = str(uuid.uuid4())
            offset_seconds = random.randint(10, 300)
            new_row["timestamp"] = row["timestamp"] + timedelta(seconds=offset_seconds * (j + 1))
            new_row["amount"] = round(row["amount"] * random.uniform(0.8, 1.2), 2)
            burst_rows.append(new_row)

    if burst_rows:
        burst_df = pd.DataFrame(burst_rows)
        df = pd.concat([df, burst_df], ignore_index=True)
        df = df.sort_values("timestamp").reset_index(drop=True)

    return df


def main() -> None:
    """Main entry point for data generation."""
    print("=" * 60)
    print("DRISHTI — Synthetic UPI Transaction Data Generator")
    print("=" * 60)

    set_seeds(SEED)
    fake = Faker("en_IN")
    Faker.seed(SEED)

    print(f"\n[1/4] Generating user pool...")
    users_df = generate_users(fake, n_users=3_000)
    print(f"       Created {len(users_df)} users across {len(INDIAN_CITIES)} cities")
    print(f"       Cohort distribution:")
    for cohort, count in users_df["cohort"].value_counts().items():
        print(f"         {cohort:12s}: {count:5d} ({count/len(users_df)*100:.1f}%)")

    print(f"\n[2/4] Generating {NUM_TRANSACTIONS:,} transactions...")
    txn_df = generate_transactions(users_df)
    print(f"       Generated {len(txn_df):,} transactions")

    print(f"\n[3/4] Injecting velocity burst patterns...")
    txn_df = inject_velocity_bursts(txn_df)
    print(f"       Total transactions after bursts: {len(txn_df):,}")

    n_fraud = txn_df["is_fraud"].sum()
    n_total = len(txn_df)
    print(f"\n[4/4] Final statistics:")
    print(f"       Total transactions : {n_total:,}")
    print(f"       Fraudulent         : {n_fraud:,} ({n_fraud/n_total*100:.2f}%)")
    print(f"       Legitimate         : {n_total - n_fraud:,} ({(n_total-n_fraud)/n_total*100:.2f}%)")
    print(f"       Date range         : {txn_df['timestamp'].min()} → {txn_df['timestamp'].max()}")
    print(f"\n       Fraud type breakdown:")
    for ftype, count in txn_df[txn_df["is_fraud"] == 1]["fraud_type"].value_counts().items():
        print(f"         {ftype:22s}: {count:5d}")

    # Save
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    txn_df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n✓ Saved to {OUTPUT_FILE}")
    print(f"  File size: {OUTPUT_FILE.stat().st_size / (1024*1024):.2f} MB")


if __name__ == "__main__":
    main()
