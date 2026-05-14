#!/usr/bin/env python3
"""
stripe_create_products.py
Run once to create all Nexora products + prices in Stripe.

Usage:
    python stripe_create_products.py sk_test_YOUR_KEY_HERE

Outputs a ready-to-paste .env block with all 6 price IDs.
"""

import sys
import urllib.request
import urllib.parse
import json
import base64

# ── Plan definitions ──────────────────────────────────────────────────────────

PLANS = [
    {
        "key":         "basic",
        "name":        "Nexora Basic",
        "description": "500 AI replies/month, CRM sync, Google Calendar",
        "monthly_usd": 2900,   # cents
        "yearly_usd":  28800,  # cents  ($24/mo × 12)
    },
    {
        "key":         "pro",
        "name":        "Nexora Pro",
        "description": "5,000 AI replies/month, custom AI personality, priority support",
        "monthly_usd": 9900,
        "yearly_usd":  99600,  # $83/mo × 12
    },
    {
        "key":         "business",
        "name":        "Nexora Business",
        "description": "Unlimited AI replies + AI calling agent (Vapi)",
        "monthly_usd": 19900,
        "yearly_usd":  199200, # $166/mo × 12
    },
]

# ── Stripe API helpers ────────────────────────────────────────────────────────

def stripe_post(api_key: str, path: str, data: dict) -> dict:
    url     = f"https://api.stripe.com/v1{path}"
    payload = urllib.parse.urlencode(data).encode()
    token   = base64.b64encode(f"{api_key}:".encode()).decode()
    req = urllib.request.Request(
        url, data=payload,
        headers={"Authorization": f"Basic {token}", "Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = json.loads(e.read())
        print(f"\n  ERROR {e.code}: {body.get('error', {}).get('message', body)}")
        sys.exit(1)


def create_product(api_key: str, name: str, description: str) -> str:
    result = stripe_post(api_key, "/products", {"name": name, "description": description})
    return result["id"]


def create_price(api_key: str, product_id: str, amount: int, interval: str) -> str:
    result = stripe_post(api_key, "/prices", {
        "product":             product_id,
        "unit_amount":         amount,
        "currency":            "usd",
        "recurring[interval]": interval,
    })
    return result["id"]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python stripe_create_products.py sk_test_YOUR_KEY")
        sys.exit(1)

    api_key = sys.argv[1].strip()
    if not api_key.startswith("sk_"):
        print("Error: key must start with sk_test_ or sk_live_")
        sys.exit(1)

    mode = "TEST" if "test" in api_key else "LIVE"
    print(f"\nConnecting to Stripe ({mode} mode)…\n")

    env_lines = ["# Monthly prices", "# Yearly prices (2 months free)"]
    monthly_lines = []
    yearly_lines  = []

    for plan in PLANS:
        print(f"Creating product: {plan['name']}…", end=" ", flush=True)
        product_id = create_product(api_key, plan["name"], plan["description"])
        print(f"OK ({product_id})")

        print(f"  → monthly ${plan['monthly_usd']//100}/mo…", end=" ", flush=True)
        monthly_id = create_price(api_key, product_id, plan["monthly_usd"], "month")
        print(f"OK ({monthly_id})")

        print(f"  → yearly  ${plan['yearly_usd']//100}/yr…", end=" ", flush=True)
        yearly_id = create_price(api_key, product_id, plan["yearly_usd"], "year")
        print(f"OK ({yearly_id})")

        key = plan["key"].upper()
        monthly_lines.append(f"STRIPE_PRICE_{key}={monthly_id}")
        yearly_lines.append(f"STRIPE_PRICE_{key}_YEARLY={yearly_id}")

    print("\n" + "="*60)
    print("Done! Paste this into your .env on the server:\n")
    print("# Monthly prices")
    for line in monthly_lines:
        print(line)
    print("# Yearly prices (2 months free)")
    for line in yearly_lines:
        print(line)
    print("="*60)
    print("\nNext: run  bash deploy.sh  on the server to apply.\n")


if __name__ == "__main__":
    main()
