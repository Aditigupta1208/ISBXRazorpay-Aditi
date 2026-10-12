from playwright.sync_api import sync_playwright
import fullwelcome
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1280,'height':900}).new_page(); pg.goto(B+'/disputes'); pg.wait_for_timeout(400)
    sh=pg.locator('section[aria-labelledby=start-here]')
    check('start here card first', sh.is_visible() and sh.bounding_box()['y']<pg.get_by_role('heading',name='Disputes',exact=True).bounding_box()['y']+300)
    hrefs=[a.get_attribute('href') for a in sh.locator('a:visible').all()]
    check('links go to C06, C15, C10', hrefs==['/disputes/C06','/disputes/C15','/disputes/C10'])
    # each step matches the real saved call
    for cid,call in [('C06','Fight'),('C15','Escalate'),('C10','Fight')]:
        pg.goto(B+f'/disputes/{cid}'); pg.wait_for_timeout(300); check(f'{cid} page shows {call}', pg.locator('main').get_by_text(call).first.is_visible())
    pg.goto(B+'/disputes/C10'); pg.wait_for_timeout(300); check('C10 shows the clear-win banner', pg.get_by_text('clear win',exact=False).first.is_visible())
    pg.goto(B+'/disputes'); pg.wait_for_timeout(300)
    pt=pg.locator('section[aria-labelledby=patterns]')
    items=pt.locator('li')
    check('five reason groups', items.count()==5)
    check('no fraud group', '10.4' not in pt.inner_text())
    check('counts add to 15', sum(int(t.split(' ')[0]) for t in [i.locator('p').first.inner_text() for i in items.all()])==15)
    check('every group has a fix', pt.get_by_text('Fix:').count()==5)
    check('biggest group first (13.1)', items.first.inner_text().startswith('13.1'))
    check('says tips are not model output', pt.get_by_text('not model output').is_visible())
    sh.locator('a:visible').first.click(); pg.wait_for_url('**/disputes/C06'); check('start link opens C06', True)
    ph=b.new_context(viewport={'width':390,'height':800}).new_page(); ph.goto(B+'/disputes'); ph.wait_for_timeout(300)
    check('phone: tour button is visible on the first screen', ph.locator('section[aria-labelledby=start-here]').get_by_role('button',name='Take the tour').bounding_box()['y']<600)
    ph.reload(); ph.wait_for_timeout(300)
    check('phone: stat tiles visible on first screen', ph.locator('div.grid.grid-cols-3 > div').first.bounding_box()['y']<760)
    check('phone: no sideways scroll', not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
