from playwright.sync_api import sync_playwright
from rows import review
ok=True
def check(n,c):
    global ok; print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
B='http://localhost:3111'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(400)
    review(pg)
    fc=pg.get_by_test_id('figure-check')
    check('figure list shows', fc.is_visible())
    check('saved draft figures are all found', fc.get_by_text('Not in a cited document').count()==0)
    check('approve enabled', pg.get_by_role('button',name='Approve and submit').is_enabled())
    ta=pg.locator('#response textarea').first
    ta.fill(ta.input_value()+' The customer used it 99 times. [E4]'); pg.wait_for_timeout(300)
    check('invented count is flagged', fc.get_by_text('Not in a cited document').count()==1)
    check('approve blocked', pg.get_by_role('button',name='Approve and submit').is_disabled())
    check('blocker says what to do', pg.get_by_text('Check 1 figure in the draft').first.is_visible())
    fc.get_by_label('I checked this figure myself').check(); pg.wait_for_timeout(200)
    check('ticking clears the block', pg.get_by_role('button',name='Approve and submit').is_enabled())
    ph=ctx.new_page(); ph.set_viewport_size({'width':390,'height':844}); ph.goto(B+'/disputes/C04'); ph.wait_for_timeout(400); review(ph)
    check('phone: no sideways scroll', ph.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    pg.goto(B+'/disputes/C15'); pg.wait_for_timeout(500)
    check('gap line on escalate', pg.get_by_test_id('named-gap').inner_text().startswith('Missing:'))
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(500)
    check('gap line on fight', pg.get_by_test_id('named-gap').inner_text().startswith('Decided by:'))
    check('customer history shown', 'earlier payments' in pg.get_by_test_id('customer-history').inner_text())
print('ALL OK' if ok else 'SOME FAILED')
