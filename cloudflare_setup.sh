#!/bin/bash
# Nexora Cloudflare Tunnel setup — fully automated
# Run from repo root: bash cloudflare_setup.sh

set -e

echo ""
echo "======================================"
echo "  Nexora Cloudflare Tunnel Setup"
echo "======================================"
echo ""

# ── Install cloudflared ───────────────────────────────────────
echo "Downloading cloudflared..."
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb
rm /tmp/cloudflared.deb
echo "✓ cloudflared installed"

# ── Install tunnel as system service ─────────────────────────
_T="ZXlKaElqb2lNRGN5TW1Wak9XRmpNbVE1TVRWaU9EbGlaRFZsTVRVNU9HTTBaR0prWXpraUxDSjBJam9pTlRNNE1EVTRaRE10WXpsak1pMDBOVGRpTFRnNFltWXRaVEE1WVdReU5XUmpZVGxpSWl3aWN5STZJazU2VFRGYVIwa3pXbFJWZEZwWFNYZGFhVEF3VDFSak1FeFVhekJOVkVGMFQwZFdhazlYU1RGYVYxRXlXbXBWTUNKOQo="
CF_TOKEN=$(echo "$_T" | base64 -d | tr -d '\n')

sudo cloudflared service install "$CF_TOKEN"
echo "✓ Cloudflare tunnel service installed"

# ── Enable and start ──────────────────────────────────────────
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sleep 3
sudo systemctl status cloudflared --no-pager

echo ""
echo "======================================"
echo "  Tunnel is running!"
echo "======================================"
echo ""
echo "  Now go to Cloudflare Dashboard:"
echo "  Zero Trust → Networks → Tunnels → nexora → Configure → Public Hostnames"
echo ""
echo "  Add these two hostnames:"
echo "  1. nexora.cmdfleet.com      → http://localhost:8000"
echo "  2. nexora-n8n.cmdfleet.com  → http://localhost:5678"
echo ""
echo "  Then test: curl https://nexora.cmdfleet.com/health"
echo ""
