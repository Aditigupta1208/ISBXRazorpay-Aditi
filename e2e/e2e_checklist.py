from playwright.sync_api import sync_playwright
from rows import open_row
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1280,'height':900}).new_page()
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(500); open_row(pg,'evidence')
    sm=pg.locator('summary:has-text("key documents in place")'); check('C06 checklist summary shown', sm.is_visible())
    print('   ',sm.inner_text())
    check('summary says what 13.2 needs', 'What 13.2 needs' in sm.inner_text())
    sm.click(); pg.wait_for_timeout(200)
    box=pg.locator('details:has(summary:has-text("key documents in place"))')
    t=box.inner_text()
    check('names the three 13.2 needs', all(x in t for x in ['The terms they agreed to','When and how they cancelled','They kept using it after cancelling']))
    check('a covered line lists its document id', '✓' in t and 'E1' in t)
    check('cites Visa and Razorpay with links', box.locator('a[href*="visa.com"]').count()==1 and box.locator('a[href*="razorpay.com/docs/api/disputes/contest"]').count()==1)
    check('says checklist not guarantee', 'not a guarantee' in t)
    pg.goto(B+'/disputes/C15'); pg.wait_for_timeout(500); open_row(pg,'evidence')
    sm=pg.locator('summary:has-text("key documents in place")'); check('C15 (13.7) checklist', 'What 13.7 needs' in sm.inner_text())
    sm.click(); t=pg.locator('details:has(summary:has-text("key documents in place"))').inner_text()
    check('13.7 mentions click-to-accept', 'click-to-accept' in t)
    check('an uncovered line says where it goes', 'Not yet. Goes in:' in t or '○' not in t)
    pg.goto(B+'/disputes/C16'); pg.wait_for_timeout(400)
    check('fraud case has no checklist', pg.locator('summary:has-text("key documents in place")').count()==0)
    pg.goto(B+'/how-it-works'); pg.wait_for_timeout(300); pg.get_by_role('tab',name='Sources and limits').click(); t=pg.inner_text('body')
    check('How it works lists sources and the rule check', 'Where the rules come from' in t and 'June 2024' in t and 'USD 600' in t)
    check('rule table has all five codes', all(c in pg.locator('table').last.inner_text() for c in ['13.1','13.2','13.3','13.6','13.7']))
    ph=b.new_context(viewport={'width':390,'height':800}).new_page(); 
    for path in ['/disputes/C06','/how-it-works']:
        ph.goto(B+path); ph.wait_for_timeout(400)
        if path.endswith('C06'): open_row(ph,'evidence'); ph.locator('summary:has-text("key documents in place")').click()
        check('phone no sideways scroll '+path, not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
