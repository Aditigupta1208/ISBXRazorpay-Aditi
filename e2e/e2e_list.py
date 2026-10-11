from playwright.sync_api import sync_playwright
import fullwelcome
ok=True
def check(n,c):
    global ok; print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
B='http://localhost:3111'
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1280,'height':900}).new_page()
    pg.goto(B+'/disputes'); pg.wait_for_timeout(400)
    ids=pg.locator('tbody tr td:first-child a').all_inner_texts()
    check('16 rows', len(ids)==16)
    check('soonest deadline first', ids[:4]==['disp_demoC10','disp_demoC06','disp_demoC15','disp_demoC02'])
    pg.get_by_role('button',name='Biggest amount').click(); pg.wait_for_timeout(200)
    ids2=pg.locator('tbody tr td:first-child a').all_inner_texts()
    check('biggest amount first, shield last', ids2[0]=='disp_demoC02' and ids2[-1]=='disp_demoC16')
    pg.get_by_role('button',name='Soonest deadline').click(); pg.wait_for_timeout(200)
    check('Chargeback Shield last', ids[-1]=='disp_demoC16')
    check('demo note shown', pg.get_by_text('Demo data: 16 made-up disputes from 14 businesses').is_visible())
    check('plain footer', pg.get_by_text('Open a dispute to run a live check').is_visible())
    check('summary still adds up', pg.get_by_text('Need a decision').locator('xpath=..').inner_text().strip().endswith('15'))
    ph=b.new_context(viewport={'width':390,'height':800}).new_page(); ph.goto(B+'/disputes'); ph.wait_for_timeout(400)
    check('phone: table hidden, cards shown', not ph.locator('table').is_visible() and ph.locator('ul[aria-label=Disputes] li').count()==16)
    ph.get_by_role('button',name='Hide').first.click(); ph.wait_for_timeout(200)
    first=ph.locator('ul[aria-label=Disputes] li').first
    box=first.bounding_box()
    check('phone: first dispute starts above the fold', box['y']+box['height']<800)
    check('phone: call chip visible in first card', first.get_by_text('Fight').first.is_visible())
    check('phone: no sideways scroll', not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    tiles=ph.locator('div.grid.grid-cols-3 > div').all(); ys={round(t.bounding_box()['y']) for t in tiles}
    check('phone: 3 summary tiles in one row', len(tiles)==3 and len(ys)==1)
    ph.get_by_role('button',name='Fold',exact=True).click(); ph.wait_for_timeout(200)
    check('phone: filter works on cards', ph.locator('ul[aria-label=Disputes] li').count()==5)
    ph.locator('ul[aria-label=Disputes] li a').first.click(); ph.wait_for_url('**/disputes/C**')
    check('phone: card opens the dispute', '/disputes/C' in ph.url)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
