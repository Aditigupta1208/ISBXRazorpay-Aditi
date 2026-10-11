from playwright.sync_api import sync_playwright
from rows import open_row, review
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.goto(B+'/disputes'); check('Results tab active on /results', (pg.get_by_role('link',name='Results').click() or True) and pg.wait_for_url('**/results') is None and pg.get_by_role('link',name='Results').get_attribute('aria-current')=='page')
    pg.wait_for_timeout(400); t=pg.inner_text('body')
    check('sample tiles: 76% won, 13 of 17, 96% on time, 23 of 24', all(x in t for x in ['76%','13 of 17','96%','23 of 24']))
    check('labelled as made up', 'made up' in t and 'not real data' in t.lower())
    check('13.3 is the weakest, with its fix', 'Weakest: 13.3' in t.replace('\n',' ') and 'Fix:' in t)
    check('calibration: High 9 of 10 vs 80%, Medium 2 of 4 vs 55%', '9 of 10' in t and '2 of 4' in t and '80%' in t and '55%' in t)
    check('other calls: 1 wrong fold of 8', '1 would have won' in t.replace('\n',' '))
    check('says nothing is trained', 'retrain' in t.lower())
    pg.get_by_label('Include 24 sample past disputes').uncheck(); pg.wait_for_timeout(200)
    check('sample off: empty state', pg.get_by_text('No results yet').is_visible())
    pg.get_by_label('Include 24 sample past disputes').check()
    # own record line before any action
    pg.goto(B+'/disputes/C05'); pg.wait_for_timeout(500); open_row(pg,'money')
    rec=pg.get_by_test_id('own-record'); check('C05 shows own record 13.2: fought 5, won 4 (80%)', rec.is_visible() and 'fought 5, won 4 (80%)' in rec.inner_text())
    # submit C04, check pending
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(400)
    review(pg)
    pg.get_by_role('button',name='Approve and submit').click(); pg.get_by_role('button',name='Yes, submit').click(); pg.wait_for_timeout(400)
    pg.goto(B+'/results'); pg.wait_for_timeout(500); t=pg.inner_text('body').replace('\n',' ')
    check('submitted: 1 waiting, tiles unchanged', 'Plus 1 you acted on in this demo, 1 waiting for Won or Lost' in t and '13 of 17' in t)
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(400)
    pg.get_by_role('button',name='Mark as won').click(); pg.wait_for_timeout(300)
    pg.goto(B+'/results'); pg.wait_for_timeout(500); t=pg.inner_text('body').replace('\n',' ')
    check('won: 14 of 18 fights and 24 of 25 on time', '14 of 18' in t and '24 of 25' in t)
    check('13.2 row now 8 disputes, 6 fought, 5 won', '8 disputes · 6 fought, 5 won' in t)
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(500)
    open_row(pg,'money'); check('C06 own record includes C04: fought 6, won 5 (83%)', 'fought 6, won 5 (83%)' in pg.get_by_test_id('own-record').inner_text())
    # fold C14
    pg.goto(B+'/disputes/C14'); pg.wait_for_timeout(400)
    pg.get_by_role('button',name='Accept dispute (Fold)',exact=True).first.click(); pg.get_by_role('button',name='Yes, fold').click(); pg.wait_for_timeout(400)
    pg.goto(B+'/results'); pg.wait_for_timeout(500); t=pg.inner_text('body').replace('\n',' ')
    check('fold counted as lost: 13.7 now 4 disputes, 2 you acted on', '4 disputes · 2 fought, 1 won' in t and 'Plus 2 you acted on' in t)
    # reset removes
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(400); pg.get_by_role('button',name='Reset this demo').click(); pg.wait_for_timeout(400)
    pg.goto(B+'/results'); pg.wait_for_timeout(500); t=pg.inner_text('body').replace('\n',' ')
    check('reset on C04 removes it from Results', 'Plus 1 you acted on' in t and '13 of 17' in t)
    pg.get_by_role('button',name='Clear what I recorded').click(); pg.wait_for_timeout(200)
    t=pg.inner_text('body').replace('\n',' '); check('clear removes all of mine', 'Nothing recorded by you yet' in t)
    pg.reload(); pg.wait_for_timeout(500); check('clear persists after reload', 'Nothing recorded by you yet' in pg.inner_text('body'))
    ph=b.new_context(viewport={'width':390,'height':800}).new_page(); ph.goto(B+'/results'); ph.wait_for_timeout(500)
    check('phone: no sideways scroll', not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    check('phone: tiles in one row', len({round(x.bounding_box()['y']) for x in ph.locator('div.grid.grid-cols-3 > div').all()})==1)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
