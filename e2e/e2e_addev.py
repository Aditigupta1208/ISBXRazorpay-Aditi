import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
from playwright.sync_api import sync_playwright
from rows import open_row, review
ok=True
def check(n,c):
    global ok; print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
B='http://localhost:3111'
D=(HERE+'/')
open(D+'g.pdf','wb').write(b'%PDF-1.4 hello world padding padding padding')
with sync_playwright() as p:
    b=p.chromium.launch()
    for label,vp in [('desktop',{'width':1280,'height':900}),('phone',{'width':390,'height':800})]:
        pg=b.new_context(viewport=vp).new_page(); pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(400)
        open_row(pg,'evidence')
        pg.get_by_role('button',name='+ Add evidence').click()
        check(label+': what-helps hint for 13.2', pg.get_by_text('What helps for 13.2:').is_visible())
        check(label+': no advisor-asked line on a Fight', pg.get_by_text('The advisor asked for:').count()==0)
        open_row(pg,'evidence')
        check(label+': styled upload button', pg.get_by_text('Upload a PDF or image').is_visible() and pg.locator('#ev-file').evaluate('e=>getComputedStyle(e).position')=='absolute')
        open_row(pg,'evidence')
        pg.set_input_files('#ev-file',D+'g.pdf'); pg.wait_for_timeout(500)
        open_row(pg,'evidence')
        check(label+': upload still works through the styled button', pg.input_value('#ev-title')=='Billing audit log')
        pg.get_by_role('button',name='Add evidence',exact=True).click(); pg.wait_for_timeout(300)
        pg.get_by_text('The call changed').wait_for(timeout=10000)
        open_row(pg,'evidence')
        check(label+': the check re-ran on its own, no stale note or tag', pg.get_by_text('Out of date').count()==0 and pg.get_by_text('Your evidence changed.').count()==0)
        check(label+': no sideways scroll', not pg.evaluate('document.documentElement.scrollWidth>innerWidth'))
    # escalate guidance
    pg=b.new_context(viewport={'width':1280,'height':900}).new_page(); pg.goto(B+'/disputes/C15'); pg.wait_for_timeout(400)
    open_row(pg,'evidence')
    pg.get_by_role('button',name='+ Add evidence').click()
    check('Escalate: advisor-asked line shown', pg.get_by_text('The advisor asked for:').is_visible())
    # stale warning in review
    pg=b.new_context(viewport={'width':1280,'height':900}).new_page(); pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(400)
    open_row(pg,'evidence')
    pg.get_by_role('button',name='+ Add evidence').click(); pg.fill('#ev-title','x'); pg.fill('#ev-text','y'); pg.get_by_role('button',name='Add evidence',exact=True).click(); pg.wait_for_timeout(300)
    pg.wait_for_timeout(1500)
    check('no stale warning: it re-ran on its own', pg.get_by_text('Re-run it before you submit.').count()==0)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
