from playwright.sync_api import sync_playwright
import fullwelcome
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
EXPECT=['/','/disputes','/disputes/C06','/disputes/C06','/disputes/C06','/disputes/C06','/disputes/C15','/disputes/C06/packet','/alerts','/results','/agent-studio','/disputes/C06','/evals','/how-it-works']
N=len(EXPECT)
def label(i): return ('for reviewers' if i>=11 else 'tour')+f' · {i+1} of {N}'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    errs=[]; pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(B+'/results'); pg.wait_for_timeout(300)
    check('no tour card before starting', pg.get_by_role('region',name='Guided tour').count()==0)
    pg.get_by_role('button',name='Take the tour').click(); pg.wait_for_url(B+'/'); pg.wait_for_timeout(700)
    card=pg.get_by_role('region',name='Guided tour'); check('tour starts on the dashboard entry', card.is_visible() and label(0) in card.inner_text().lower())
    for i in range(N):
        pg.wait_for_timeout(900)
        check(f'step {i+1} is on {EXPECT[i]}', pg.url.endswith(EXPECT[i]) and label(i) in card.inner_text().lower())
        pg.wait_for_timeout(500)
        sp=pg.locator('[data-tour-spot]').bounding_box(); op=pg.evaluate("getComputedStyle(document.querySelector('[data-tour-spot]')).opacity")
        check(f'step {i+1} spotlights its target', sp is not None and op=='1' and sp['height']>10)
        box=card.bounding_box(); check(f'step {i+1} card on screen', box['y']>=0 and box['y']+box['height']<=900 and box['x']>=0)
        if sp:
            ov=not (sp['x']+sp['width']<=box['x'] or box['x']+box['width']<=sp['x'] or sp['y']+sp['height']<=box['y'] or box['y']+box['height']<=sp['y'])
            check(f'step {i+1} card does not cover the target', not ov)
            check(f'step {i+1} target on screen', sp['y']>=0 and sp['y']<900)
        if i==4:
            pg.reload(); pg.wait_for_timeout(900); check('tour survives a reload', label(4) in pg.get_by_role('region',name='Guided tour').inner_text().lower())
            pg.get_by_role('button',name='Back',exact=True).click(); pg.wait_for_timeout(500); check('Back goes to step 4', label(3) in card.inner_text().lower())
            pg.get_by_role('button',name='Next').click(); pg.wait_for_timeout(500)
        if i<N-1: pg.get_by_role('button',name='Next').click()
    pg.get_by_role('button',name='Finish').click(); pg.wait_for_timeout(300); check('Finish closes the tour', pg.get_by_role('region',name='Guided tour').count()==0)
    pg.get_by_role('button',name='Take the tour').click(); pg.wait_for_timeout(700); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check('Escape closes', pg.get_by_role('region',name='Guided tour').count()==0)
    pg.reload(); pg.wait_for_timeout(400); check('stays closed after reload', pg.get_by_role('region',name='Guided tour').count()==0)
    pg.goto(B+'/disputes'); pg.wait_for_timeout(300)
    pg.locator('section[aria-labelledby=start-here]').get_by_role('button',name='Take the tour').click(); pg.wait_for_timeout(500)
    check('welcome card button opens the tour', pg.get_by_role('region',name='Guided tour').is_visible())
    ph=b.new_context(viewport={'width':390,'height':800}).new_page(); ph.goto(B+'/disputes'); ph.wait_for_timeout(300)
    ph.get_by_role('button',name='Take the tour').first.click(); ph.wait_for_timeout(800)
    c=ph.get_by_role('region',name='Guided tour'); bx=c.bounding_box()
    check('phone: card fits the screen', c.is_visible() and bx['x']>=0 and bx['x']+bx['width']<=390 and bx['y']+bx['height']<=800)
    check('phone: no sideways scroll', ph.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    for _ in range(N-1): ph.get_by_role('button',name='Next').click(); ph.wait_for_timeout(600)
    check(f'phone: reaches step {N}', label(N-1) in c.inner_text().lower())
    ph.get_by_role('button',name='Close').click()
    print(errs); check('no console errors', not errs)
print('ALL OK' if ok else 'SOME FAILED')
