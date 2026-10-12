from playwright.sync_api import sync_playwright
from rows import open_row, review
ok=True
def check(n,c):
    global ok; print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
B='http://localhost:3111'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(400)
    review(pg)
    check('docs by slot show names', pg.locator('#response').get_by_text('Terms acceptance record').is_visible())
    review(pg)
    pg.locator('#response').get_by_role('button',name='E3').first.click(); pg.wait_for_timeout(200)
    open_row(pg,'evidence')
    check('clicking a named doc highlights it', pg.locator('#ev-E3.border-brand').count()==1)
    check('copy button says what it copies', pg.get_by_role('button',name='Copy response').is_visible())
    review(pg)
    pg.get_by_role('button',name='Approve and submit').click()
    check('dialog says simulated', pg.get_by_role('dialog').get_by_text('Simulated: nothing leaves this demo.').is_visible())
    pg.get_by_role('button',name='Yes, submit').click(); pg.wait_for_timeout(400)
    check('plain confirmation with amount and doc count', pg.get_by_text('You contested $1,200 of $1,200 with 4 documents.').is_visible())
    check('request hidden until opened', pg.locator('pre:visible').count()==0)
    pg.get_by_text('What would be sent').click()
    check('request shows after opening', pg.get_by_text('PATCH /v1/disputes/disp_demoC04/contest').locator('visible=true').count()>=1)
    # fold
    pg.goto(B+'/disputes/C14'); pg.wait_for_timeout(400)
    pg.get_by_role('button',name='Accept dispute',exact=True).first.click()
    check('fold dialog says simulated', pg.get_by_role('dialog').get_by_text('Simulated: nothing leaves this demo.').is_visible())
    pg.get_by_role('button',name='Yes, accept').click(); pg.wait_for_timeout(400)
    check('fold confirmation plain', pg.get_by_text('You accepted the dispute.').is_visible())
    ph=b.new_context(viewport={'width':360,'height':800}).new_page(); ph.set_viewport_size({'width':360,'height':800}); ph.goto(B+'/disputes/C04'); ph.wait_for_timeout(400)
    review(ph)
    ph.get_by_role('button',name='Approve and submit').click(); ph.get_by_role('button',name='Yes, submit').click(); ph.wait_for_timeout(300); ph.get_by_text('What would be sent').click()
    check('no sideways scroll after submit at 360px', not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
