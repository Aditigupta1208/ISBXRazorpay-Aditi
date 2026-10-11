from playwright.sync_api import sync_playwright
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':900})
    pg.goto(B+'/evals'); pg.wait_for_selector('#rules'); t=pg.inner_text('#rules')
    check('section present', 'Why not just write smarter rules?' in pg.inner_text('body'))
    pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); sec=pg.locator('#rules-details'); st=sec.inner_text()
    check('9 rules reach 20 of 20', '9 extra rules get 20 of 20' in st)
    check('unseen: 6 of 10 vs simple 7 of 10, fewer than', '6 of 10' in st and '7 of 10' in st and 'fewer than' in st)
    check('names the misses with the rule that misfired', 'C22 (rule T2 fired wrongly)' in st and 'C23' in st and 'C24' in st and 'C30' in st)
    check('says frozen before cases', 'frozen and committed before' in st)
    check('says proposed not confirmed', '10 of the 10 answers are still proposed' in st)
    check('agent not run on unseen', 'Not run' in st)
    check('does not claim agent is better', 'one run on free models' in st)
    body=pg.inner_text('body'); check('newer cases line updated', 'C21 to C30: unseen test cases' in body)
    pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)"); pg.wait_for_timeout(150); body=pg.inner_text('body')
    check('unseen rows are in the case table', 'C27' in body and 'C30' in body)
    check('no sideways scroll desktop', pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    ph=b.new_page(viewport={'width':390,'height':844}); ph.goto(B+'/evals'); ph.wait_for_selector('#rules')
    check('phone: no sideways page scroll', ph.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    h=b.new_page(); h.goto(B+'/how-it-works'); h.get_by_role('tab',name='The product').click(); h.wait_for_timeout(300)
    check('how it works: gate text counts cases', 'every case in the eval set (40 today)' in h.inner_text('body'))
    # demo list is unchanged: no unseen cases in the disputes list
    d=b.new_page(); d.goto(B+'/disputes'); d.wait_for_timeout(500); tb=d.inner_text('body')
    check('disputes list still shows the 16 demo cases only', 'C16' in tb and 'C21' not in tb and 'C30' not in tb)
    r=d.goto(B+'/disputes/C21'); check('unseen case is not a demo page (404)', r.status==404)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
