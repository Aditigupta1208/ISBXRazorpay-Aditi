from playwright.sync_api import sync_playwright
from rows import review
ok=True
def check(n,c):
    global ok; print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
B='http://localhost:3111'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}, permissions=['clipboard-read','clipboard-write']); pg=ctx.new_page()
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(500)
    pg.get_by_test_id('copy-summary').click(); pg.wait_for_timeout(300)
    txt=pg.evaluate('navigator.clipboard.readText()')
    check('summary copied with call and disclaimer', "Advisor's call: Fight" in txt and 'nothing has been sent' in txt and 'Decided by' in txt)
    check('button says Copied', 'Copied' in pg.get_by_test_id('copy-summary').inner_text())
    review(pg)
    pg.get_by_test_id('packet-link').click(); pg.wait_for_url('**/packet'); pg.wait_for_timeout(500)
    pk=pg.get_by_test_id('packet'); t=pk.inner_text()
    check('packet cover has dispute and amount', 'disp_demoC04' in t and '$1,200' in t)
    check('packet numbers exhibits', 'Exhibit 1' in t and 'Contents' in t)
    check('citations became exhibit numbers', '[Exhibit' in t and '[E3]' not in t and '[E4]' not in t)
    check('packet has the disclaimer', 'concept prototype' in t.lower())
    check('exhibits start on new pages', pg.locator('[data-testid=packet] section').count()>=3)
    pg.goto(B+'/disputes/C15'); pg.wait_for_timeout(500)
    wi=pg.get_by_test_id('what-if'); check('what-if shows on escalate', wi.is_visible())
    check('default says ask now', 'Ask now' in pg.get_by_test_id('deadline-verdict').inner_text())
    pg.locator('#wait').select_option('two'); pg.wait_for_timeout(150)
    check('two days with 18h left is too late', pg.get_by_test_id('deadline-verdict').inner_text().startswith('Too late'))
    pg.locator('#wait').select_option('hours'); pg.wait_for_timeout(150)
    check('a few hours with 18h left is tight', pg.get_by_test_id('deadline-verdict').inner_text().startswith('Tight'))
    pg.goto(B+'/disputes/C04'); check('no what-if on fight', pg.get_by_test_id('what-if').count()==0)
    ph=ctx.new_page(); ph.set_viewport_size({'width':390,'height':844}); ph.goto(B+'/disputes/C15'); ph.wait_for_timeout(500)
    check('phone: no sideways scroll on C15', ph.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    ph.goto(B+'/disputes/C04/packet'); ph.wait_for_timeout(500)
    check('phone: no sideways scroll on packet', ph.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
print('ALL OK' if ok else 'SOME FAILED')
