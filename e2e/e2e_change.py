from playwright.sync_api import sync_playwright
import re
from rows import open_row, review
ok=True
def check(n,c):
    global ok; print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
B='http://localhost:3111'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(400)
    open_row(pg,'money')
    check('fee label reworded', pg.get_by_text('Possible fee if you fight and lose').is_visible() and pg.get_by_text('Only if the bank escalates.').is_visible())
    check('no banner before any re-run', pg.get_by_text('The call changed').count()==0)
    open_row(pg,'evidence')
    pg.get_by_role('button',name='+ Add evidence').click(); pg.fill('#ev-title','Billing audit log'); pg.fill('#ev-text','30 Jul 2026: customer clicked Cancel subscription')
    pg.get_by_role('button',name='Add evidence',exact=True).click()
    pg.get_by_text('The call changed').first.wait_for(timeout=15000)
    check('banner says Fight → Accept', pg.get_by_label('Fight to Accept').is_visible())
    check('banner names the new document', pg.get_by_text('The new document E5 decided it.').is_visible())
    pg.get_by_role('button',name='Show the document').click(); pg.wait_for_timeout(300)
    open_row(pg,'evidence')
    check('document highlighted', pg.locator('#ev-E5.border-brand').count()==1)
    pg.reload(); pg.wait_for_timeout(500)
    check('banner survives reload', pg.get_by_label('Fight to Accept').is_visible())
    pg.get_by_role('button',name='Dismiss').click()
    check('dismiss removes it', pg.get_by_text('The call changed').count()==0)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
