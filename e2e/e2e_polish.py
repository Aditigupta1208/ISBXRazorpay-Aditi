from playwright.sync_api import sync_playwright
import fullwelcome
from rows import open_row
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    errs=[]; pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    r=pg.goto(B+'/nope'); check('404 status', r.status==404)
    check('404 branded page', pg.get_by_role('heading',name='We could not find that page').is_visible())
    check('404 keeps banner', pg.get_by_text('Not an official Razorpay product').first.is_visible())
    pg.get_by_role('link',name='All disputes').first.click(); pg.wait_for_url('**/disputes'); check('404 link goes to list', True)
    r=pg.goto(B+'/disputes/C17'); check('eval-only case is 404 page', r.status==404 and pg.get_by_text('We could not find').is_visible())
    errs.clear()  # the two 404 loads above are expected
    r=ctx.request.get(B+'/icon.svg'); check('icon served', r.status==200 and 'svg' in r.headers.get('content-type',''))
    r=ctx.request.get(B+'/opengraph-image'); check('og image is png', r.status==200 and r.headers.get('content-type')=='image/png')
    h=ctx.request.get(B+'/disputes').text(); check('og meta present', 'og:image' in h and 'rel="icon"' in h)
    # timeline
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(400)
    open_row(pg,'timeline'); tl=pg.locator('#row-timeline'); check('timeline shown on C06', tl.is_visible())
    items=tl.locator('li'); check('timeline has 4 events in order', items.count()==4 and '3 Aug 2025' in items.first.inner_text() and 'Dispute raised' in items.last.inner_text())
    items.nth(1).locator('button').click(); pg.wait_for_timeout(500)
    pg.wait_for_timeout(300); check('timeline chip highlights evidence', 'border-brand' in (pg.locator('#ev-E3').get_attribute('class') or ''))
    # prev / next
    nav=pg.locator('nav[aria-label="Other disputes"]'); check('prev/next nav present', nav.is_visible())
    first=pg.locator('a:has-text("Next:")')
    if first.count():
        href=first.first.get_attribute('href'); first.first.click(); pg.wait_for_url('**'+href); check('next goes to '+href, True)
    # first and last in list order
    pg.goto(B+'/disputes'); pg.wait_for_timeout(300)
    order=[a.get_attribute('href').split('/')[-1] for a in pg.locator('table a[href^="/disputes/"]').all()]
    order=list(dict.fromkeys(order)); pg.goto(B+'/disputes/'+order[0]); pg.wait_for_timeout(300)
    check('first dispute has no Previous', pg.locator('a:has-text("Previous:")').count()==0 and pg.locator('a:has-text("Next:")').count()==1)
    pg.goto(B+'/disputes/'+order[-1]); pg.wait_for_timeout(300)
    check('last dispute has no Next', pg.locator('a:has-text("Next:")').count()==0 and pg.locator('a:has-text("Previous:")').count()==1)
    check('print button there', pg.get_by_role('button',name='Print or save as PDF').is_visible())
    # escalate chip
    pg.goto(B+'/disputes'); pg.wait_for_timeout(300)
    check('escalate chip uses hand-over arrow', '↗' in pg.locator('table').first.inner_text() or '↗' in pg.locator('main').inner_text())
    # hide tips persists
    pg.get_by_role('button',name='Hide',exact=True).click(); pg.reload(); pg.wait_for_timeout(400)
    check('welcome hidden after reload', pg.get_by_role('button',name='Show the welcome').is_visible())
    pg.get_by_role('button',name='Show the welcome').click(); check('welcome comes back', pg.locator('h2:has-text("Should you fight this dispute?")').is_visible())
    # evals jump nav
    pg.goto(B+'/evals'); pg.wait_for_timeout(300)
    nav=pg.locator('nav[aria-label="On this page"]'); check('evals jump links', nav.locator('a').count()==5)
    for a in nav.locator('a').all():
        t=a.get_attribute('href')[1:]; check('anchor exists '+t, pg.locator('#'+t).count()==1)
    # agent setup label
    pg.goto(B+'/agent-studio'); pg.wait_for_timeout(300); check('setup says demo only', pg.get_by_text('in this browser only', exact=False).is_visible())
    # print emulation hides chrome
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(300); pg.emulate_media(media='print')
    check('print hides tabs and buttons', not pg.locator('nav[aria-label="Sections"]').is_visible() and not pg.get_by_role('button',name='Print or save as PDF').is_visible())
    pg.emulate_media(media='screen')
    # phone: fade mask on tabs + no horizontal page scroll
    ph=b.new_context(viewport={'width':390,'height':800}).new_page(); ph.goto(B+'/disputes/C06'); ph.wait_for_timeout(300)
    check('phone shows all three merchant tabs', all(ph.get_by_role('link',name=n,exact=True).first.bounding_box()['x']+ph.get_by_role('link',name=n,exact=True).first.bounding_box()['width']<=390 for n in ['Disputes','Results','Agent setup']))
    check('phone no sideways page scroll', ph.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    print(errs); check('no console errors', not errs)
print('ALL OK' if ok else 'SOME FAILED')
