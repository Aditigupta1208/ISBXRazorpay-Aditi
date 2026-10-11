import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
import sys
from playwright.sync_api import sync_playwright
from rows import open_row
B='http://localhost:3111'; ok=True; R=(HERE+'/../lib/fixtures/')
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1280,'height':900}).new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(500); open_row(pg,'evidence'); pg.get_by_role('button',name='+ Add evidence').click()
    pg.set_input_files('#ev-file',R+'terms.pdf'); [pg.wait_for_timeout(250) for _ in range(60) if not pg.input_value('#ev-text')]
    check('title comes from the file name', pg.input_value('#ev-title')=='terms')
    t=pg.input_value('#ev-text')
    check('text read from the PDF, both pages', 'Renews annually' in t and 'refund policy, 7 days' in t)
    check('merchant can edit it before adding', pg.locator('#ev-text').is_editable())
    pg.get_by_role('button',name='Add evidence',exact=True).click(); pg.wait_for_timeout(400)
    check('it becomes evidence E5', pg.locator('#ev-E5').is_visible())
    pg.get_by_role('button',name='+ Add evidence').click()
    pg.set_input_files('#ev-file',R+'blank.pdf'); pg.wait_for_timeout(1500)
    check('scanned/blank PDF: asks for a paste', 'no selectable text' in pg.inner_text('body'))
    check('no page errors', not errs)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
