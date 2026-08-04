#!/usr/bin/env python3
"""Test the full auth flow: login -> session -> gamification -> progress"""
import urllib.request, json, http.cookiejar, sys, time

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
BASE = "http://127.0.0.1:3000"

try:
    # 1. Login
    data = json.dumps({"email": "test@somali.app", "password": "TestPass123!"}).encode()
    req = urllib.request.Request(f"{BASE}/api/auth/login", data=data, headers={"Content-Type": "application/json"})
    resp = opener.open(req, timeout=15)
    body = json.loads(resp.read())
    user = body.get("user", {})
    print(f"[1] Login: {resp.status} | user={user.get('email')} role={user.get('role')}")

    # Check cookie was set
    cookie_names = [c.name for c in cj]
    print(f"    Cookies set: {cookie_names}")
    if "next-auth.session-token" not in cookie_names:
        print("    FAIL: No session token cookie!")
        sys.exit(1)

    time.sleep(1)

    # 2. Session check
    req2 = urllib.request.Request(f"{BASE}/api/auth/session")
    resp2 = opener.open(req2, timeout=15)
    session = json.loads(resp2.read())
    sess_user = session.get("user", {})
    print(f"[2] Session: {resp2.status} | user={sess_user.get('email')} id={sess_user.get('id','?')}")
    if resp2.status != 200 or not sess_user.get("id"):
        print(f"    FAIL: Session not restored! Body: {json.dumps(session)[:200]}")
        sys.exit(1)

    # 3. Gamification check
    req3 = urllib.request.Request(f"{BASE}/api/gamification")
    resp3 = opener.open(req3, timeout=15)
    gam = json.loads(resp3.read())
    print(f"[3] Gamification: {resp3.status} | XP={gam.get('totalXp', 0)} Hearts={gam.get('hearts', {}).get('current', '?')} Coins={gam.get('coins', 0)}")

    # 4. Progress check
    req4 = urllib.request.Request(f"{BASE}/api/progress")
    resp4 = opener.open(req4, timeout=15)
    prog = json.loads(resp4.read())
    print(f"[4] Progress: {resp4.status} | {len(prog)} entries")
    for lid, p in prog.items():
        print(f"    {lid}: completed={p.get('completed')} score={p.get('score')}")

    print("\n=== ALL AUTH CHECKS PASSED ===")

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
