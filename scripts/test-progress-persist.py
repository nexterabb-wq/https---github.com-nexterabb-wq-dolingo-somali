#!/usr/bin/env python3
"""Test: Save progress, then re-read to confirm it persists"""
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
    print(f"[1] Login: {resp.status} | user={body.get('user',{}).get('email')}")
    time.sleep(1)

    # 2. Save progress for lesson-01-01
    prog_data = json.dumps({"lessonId": "lesson-01-01", "score": 80, "xpEarned": 30}).encode()
    req2 = urllib.request.Request(f"{BASE}/api/progress", data=prog_data, headers={"Content-Type": "application/json"})
    resp2 = opener.open(req2, timeout=15)
    save_result = json.loads(resp2.read())
    print(f"[2] Save progress: {resp2.status} | success={save_result.get('success')}")
    time.sleep(1)

    # 3. Read progress back (simulating a page reload - same cookie)
    req3 = urllib.request.Request(f"{BASE}/api/progress")
    resp3 = opener.open(req3, timeout=15)
    prog = json.loads(resp3.read())
    print(f"[3] Read progress: {resp3.status} | entries={len(prog)}")

    if "lesson-01-01" in prog:
        p = prog["lesson-01-01"]
        print(f"    lesson-01-01: completed={p.get('completed')} score={p.get('score')} attempts={p.get('attempts')}")
        if p.get('completed') and p.get('score') == 80:
            print("\n=== PROGRESS PERSISTENCE VERIFIED ===")
        else:
            print(f"\n=== FAIL: Unexpected values ===")
            sys.exit(1)
    else:
        print(f"\n=== FAIL: lesson-01-01 not in progress map ===")
        sys.exit(1)

    # 4. Check gamification was updated
    req4 = urllib.request.Request(f"{BASE}/api/gamification")
    resp4 = opener.open(req4, timeout=15)
    gam = json.loads(resp4.read())
    print(f"[4] Gamification after save: XP={gam.get('totalXp',0)} Coins={gam.get('coins',0)}")
    if gam.get('totalXp',0) >= 30:
        print("    XP persisted correctly")
    else:
        print(f"    WARNING: Expected XP >= 30, got {gam.get('totalXp',0)}")

    # 5. Simulate "page reload" - new session with same cookie
    time.sleep(1)
    req5 = urllib.request.Request(f"{BASE}/api/auth/session")
    resp5 = opener.open(req5, timeout=15)
    session2 = json.loads(resp5.read())
    print(f"[5] Session after reload: {resp5.status} | user={session2.get('user',{}).get('email')}")

    req6 = urllib.request.Request(f"{BASE}/api/progress")
    resp6 = opener.open(req6, timeout=15)
    prog2 = json.loads(resp6.read())
    print(f"[6] Progress after reload: {len(prog2)} entries")
    if "lesson-01-01" in prog2 and prog2["lesson-01-01"].get("completed"):
        print("    lesson-01-01 still completed after 'reload'")
        print("\n=== SESSION + PROGRESS PERSISTENCE FULLY VERIFIED ===")
    else:
        print("\n=== FAIL: Progress lost after reload ===")
        sys.exit(1)

except Exception as e:
    print(f"ERROR: {e}")
    import traceback; traceback.print_exc()
    sys.exit(1)
