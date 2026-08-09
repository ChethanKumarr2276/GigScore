"""
bulk_seed.py — one-time script to seed ~1000 applicants from loans.csv
into gigscore.db, reusing the real ml.m1_scorecard band->label mapping.

USAGE (run from /home/notcky/GigScore/backend, with venv active):
    python3 bulk_seed.py
"""

import csv
import random
import shutil
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

# --- config ---------------------------------------------------------------
DB_PATH = Path("gigscore.db")
CSV_PATH = Path("../loans.csv")  # adjust if your CSV lives elsewhere
SAMPLE_SIZE = 1000
SEED = 42  # fixed seed so this is reproducible if you need to re-run

PLATFORMS = ["Uber", "Zomato", "Swiggy", "Porter", "Ola", "Rapido", "Dunzo"]

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
    "Ishaan", "Rohan", "Ananya", "Diya", "Priya", "Isha", "Kavya", "Meera",
    "Riya", "Sneha", "Pooja", "Anjali", "Karthik", "Vikram", "Rahul", "Amit",
    "Suresh", "Ramesh", "Deepak", "Manoj", "Sanjay", "Rajesh", "Lakshmi",
    "Divya", "Neha", "Shreya", "Pallavi", "Swathi", "Nisha", "Bhavana",
]
LAST_NAMES = [
    "Sharma", "Verma", "Reddy", "Rao", "Kumar", "Singh", "Iyer", "Nair",
    "Menon", "Gupta", "Patel", "Shah", "Joshi", "Desai", "Pillai", "Naidu",
    "Sundaram", "Krishnan", "Raman", "Bhat",
]

# ---------------------------------------------------------------------------
# Pull the REAL band -> label mapping from your ml code, so it never drifts
# ---------------------------------------------------------------------------
sys.path.insert(0, ".")
try:
    from ml.m1_scorecard import _BAND_TO_LABEL
except ImportError as e:
    print(f"Could not import _BAND_TO_LABEL from ml.m1_scorecard: {e}")
    print("Run this script from the backend root (where the ml/ folder lives).")
    sys.exit(1)

# Rough pd / p_approve ranges per band (CSV has no real probabilities)
PD_RANGES = {
    "PRIME": (0.01, 0.06),
    "STRONG": (0.05, 0.12),
    "RELIABLE": (0.10, 0.22),
    "EMERGING": (0.20, 0.38),
    "BUILDING": (0.25, 0.45),
}
APPROVE_RANGES = {
    "PRIME": (0.90, 0.99),
    "STRONG": (0.80, 0.93),
    "RELIABLE": (0.65, 0.85),
    "EMERGING": (0.45, 0.70),
    "BUILDING": (0.35, 0.60),
}
EVIDENCE_WEIGHTS = {
    "PRIME": [("High", 0.7), ("Medium", 0.25), ("Low", 0.05)],
    "STRONG": [("High", 0.5), ("Medium", 0.4), ("Low", 0.1)],
    "RELIABLE": [("High", 0.25), ("Medium", 0.55), ("Low", 0.2)],
    "EMERGING": [("High", 0.1), ("Medium", 0.45), ("Low", 0.45)],
    "BUILDING": [("High", 0.05), ("Medium", 0.35), ("Low", 0.6)],
}


def weighted_choice(rng: random.Random, weights: list[tuple[str, float]]) -> str:
    total = sum(w for _, w in weights)
    r = rng.uniform(0, total)
    upto = 0.0
    for label, w in weights:
        upto += w
        if upto >= r:
            return label
    return weights[-1][0]


def gen_unique_phone(rng: random.Random, used: set[str]) -> str:
    while True:
        phone = "9" + "".join(str(rng.randint(0, 9)) for _ in range(9))
        if phone not in used:
            used.add(phone)
            return phone


def main() -> None:
    if not DB_PATH.exists():
        print(f"ERROR: {DB_PATH} not found. Run this from GigScore/backend.")
        sys.exit(1)
    if not CSV_PATH.exists():
        print(f"ERROR: {CSV_PATH} not found. Adjust CSV_PATH at top of script.")
        sys.exit(1)

    # --- backup first, always ---------------------------------------------
    backup_path = DB_PATH.with_name(
        f"gigscore.db.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    )
    shutil.copy2(DB_PATH, backup_path)
    print(f"Backed up DB to {backup_path}")

    rng = random.Random(SEED)

    # --- load + sample CSV ---------------------------------------------------
    with open(CSV_PATH, newline="") as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} rows from {CSV_PATH}")

    sample = rng.sample(rows, min(SAMPLE_SIZE, len(rows)))
    print(f"Sampled {len(sample)} rows")

    # --- connect + find existing ids to avoid collisions ---------------------
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT gigtrust_id FROM workers")
    existing_ids = {r[0] for r in cur.fetchall()}
    cur.execute("SELECT phone FROM workers")
    used_phones = {r[0] for r in cur.fetchall()}

    now = datetime.now(timezone.utc).isoformat()

    inserted = 0
    skipped_existing = 0
    skipped_bad_band = 0

    for row in sample:
        gid = row["gigtrust_id"]
        band = row["grs_band"]

        if gid in existing_ids:
            skipped_existing += 1
            continue
        if band not in _BAND_TO_LABEL:
            skipped_bad_band += 1
            continue

        existing_ids.add(gid)

        name = f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"
        phone = gen_unique_phone(rng, used_phones)
        platform = rng.choice(PLATFORMS)

        pd_lo, pd_hi = PD_RANGES[band]
        pd = rng.uniform(pd_lo, pd_hi)
        if row.get("defaulted") == "1":
            pd = min(0.95, pd + rng.uniform(0.1, 0.2))

        pa_lo, pa_hi = APPROVE_RANGES[band]
        p_approve = rng.uniform(pa_lo, pa_hi)
        if row.get("approved") == "0":
            p_approve = max(0.05, p_approve - rng.uniform(0.15, 0.3))

        evidence_quality = weighted_choice(rng, EVIDENCE_WEIGHTS[band])

        cur.execute(
            """INSERT INTO workers (gigtrust_id, name, phone, primary_platform, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            (gid, name, phone, platform, now),
        )
        cur.execute(
            """INSERT INTO assessments
               (gigtrust_id, grs, grs_band, financial_assessment, pd, p_approve,
                interest_rate, max_amount, evidence_quality, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                gid,
                float(row["grs"]),
                band,
                _BAND_TO_LABEL[band],
                round(pd, 4),
                round(p_approve, 4),
                float(row["engine_rate"]),
                float(row["engine_amount"]),
                evidence_quality,
                now,
            ),
        )
        inserted += 1

    conn.commit()

    cur.execute("SELECT COUNT(*) FROM workers")
    total_workers = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM assessments")
    total_assessments = cur.fetchone()[0]
    conn.close()

    print("\n--- Done ---")
    print(f"Inserted:            {inserted}")
    print(f"Skipped (dup id):    {skipped_existing}")
    print(f"Skipped (bad band):  {skipped_bad_band}")
    print(f"Workers table total: {total_workers}")
    print(f"Assessments total:   {total_assessments}")
    print(f"\nIf anything looks wrong, restore with:")
    print(f"  cp {backup_path} {DB_PATH}")


if __name__ == "__main__":
    main()
