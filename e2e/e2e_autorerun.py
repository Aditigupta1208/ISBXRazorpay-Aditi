import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
from playwright.sync_api import sync_playwright
from rows import open_row
ok=True
def check(n,c):
    global ok; print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
B='http://localhost:3111'
D=(HERE+'/')
with sync_playwright() as p:
    b=p.chromium.launch()
    for label,vp in [('desktop',{'width':1280,'height':900}),('phone',{'width':390,'height':800})]:
        pg=b.new_context(viewport=vp).new_page(); pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(400)
        open_row(pg,'evidence')
        pg.get_by_role('button',name='+ Add evidence').click()
        pg.fill('#ev-title','Cancellation email'); pg.fill('#ev-text','30 Jul 2026: customer clicked Cancel subscription')
        pg.get_by_role('button',name='Add evidence',exact=True).click()
        pg.get_by_text('The call changed').wait_for(timeout=10000)
        pg.wait_for_timeout(1200)
        check(label+': the check re-ran on its own after adding', True)
        check(label+': page scrolled up to the new answer', pg.evaluate('scrollY')<250 and pg.locator('#call-changed').is_visible())
        pg.screenshot(path=D+'flip-'+label+'.png')
        check(label+': no stale note left', pg.get_by_text('Your evidence changed.').count()==0 and pg.get_by_text('Out of date').count()==0)
        # remove it again: re-runs on its own too
        open_row(pg,'evidence')
        pg.get_by_role('button',name='Remove').first.click()
        pg.wait_for_timeout(1500)
        check(label+': no stale note after removing', pg.get_by_text('Your evidence changed.').count()==0 and pg.get_by_text('Out of date').count()==0)
        check(label+': no sideways scroll', not pg.evaluate('document.documentElement.scrollWidth>innerWidth'))
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
