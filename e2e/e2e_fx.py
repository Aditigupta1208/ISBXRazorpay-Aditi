import sys
from playwright.sync_api import sync_playwright
mode=sys.argv[1]; B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
exp={'live':('96.30','live rate','5 Oct 2026'),'pinned':('95.50','fixed rate','fixed by the builder'),'fallback':('88','demo rate','demo value')}[mode]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1280,'height':900}).new_page(); pg.goto(B+'/disputes'); pg.wait_for_timeout(400)
    t=pg.inner_text('body')
    check('list footer note has rate '+exp[0], exp[0] in t and exp[2] in t)
    check('list stat label says '+exp[1], f'At stake ({exp[1]})' in t)
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(400); t=pg.inner_text('body')
    rate=float(exp[0])
    amt=pg.locator('text=At stake').first.locator('xpath=..').inner_text()
    check('C06 at stake = USD 480 x rate', '₹'+format(round(480*rate),',') in amt.replace('\n',' '))
    check('C06 header shows per-USD rate', f'per USD' in t)
    pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
    pg.get_by_role('button',name='Under the hood ›').click(); pg.wait_for_timeout(200)
    check('under the hood has the rate note', exp[2] in pg.get_by_role('dialog').inner_text())
    pg.keyboard.press('Escape')
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(300)
    pg.get_by_role('button',name='Accept dispute (Fold)',exact=True).first.click(); pg.wait_for_timeout(200)
    d=pg.get_by_role('dialog').inner_text(); check('fold dialog names '+exp[1], exp[1] in d and ('₹'+exp[0]) in d)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
