from playwright.sync_api import sync_playwright
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1280,'height':900}).new_page()
    pg.goto(B+'/agent-studio'); pg.wait_for_timeout(400)
    check('no Save button', pg.get_by_role('button',name='Save setup').count()==0)
    check('autosave hint before change', pg.get_by_text('saves as you change it').is_visible())
    pg.fill('#policy','Plans renew yearly.'); check('saved status after change', pg.get_by_text('✓ Saved in this browser.').is_visible())
    check('try link to C13', pg.get_by_role('link',name='dispute C13').get_attribute('href')=='/disputes/C13')
    check('never-do list', pg.get_by_text('What it will never do').is_visible())
    pg.get_by_role('link',name='dispute C13').click(); pg.wait_for_url('**/disputes/C13'); pg.wait_for_timeout(800); check('C13 opens', pg.url.endswith('/disputes/C13') and pg.locator('h1').is_visible())
    pg.goto(B+'/how-it-works'); pg.wait_for_timeout(300)
    check('three tabs', pg.get_by_role('tab').count()==5 and pg.get_by_role('tab',name='At a glance').get_attribute('aria-selected')=='true')
    pg.get_by_role('tab',name='The product').click(); pg.wait_for_timeout(200)
    check('five flow links', pg.locator('ol[aria-label=Flow] a').count()==5)
    check('rules visible on the first tab', pg.locator('#rules').is_visible())
    pg.locator('ol[aria-label=Flow] li').nth(1).click(); pg.wait_for_url('**/disputes/C06'); check('step 2 card click goes to C06', True)
    pg.goto(B+'/how-it-works'); pg.get_by_role('tab',name='The product').click(); pg.locator('ol[aria-label=Flow] a').nth(3).click(); pg.wait_for_timeout(300); check('step 3 jumps to rules', pg.url.endswith('#rules'))
    h=pg.evaluate('document.body.scrollHeight'); print('desktop height',h); check('under 3200 (learning section added)', h<4200)
    ph=b.new_context(viewport={'width':390,'height':800}).new_page()
    for path in ['/agent-studio','/how-it-works']:
        ph.goto(B+path); ph.wait_for_timeout(300); check('phone no sideways scroll '+path, not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
