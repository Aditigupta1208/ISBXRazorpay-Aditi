import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
import os
import re
MODEL=os.environ.get("EXPECT_MODEL","claude-sonnet-5-5")
import json
from playwright.sync_api import sync_playwright
from rows import open_row, review
ok=True
def check(n,c):
    global ok; print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
B='http://localhost:3111'
D=(HERE+'/')
def mk(name,body): open(D+name,'wb').write(body); return D+name
good=mk('ok.pdf',b'%PDF-1.4 hello world padding padding padding')
unr=mk('unr.pdf',b'%PDF-1.4 UNREADABLE padding padding padding')
card=mk('card.pdf',b'%PDF-1.4 CARDNUM padding padding padding')
lng=mk('long.pdf',b'%PDF-1.4 LONGDOC padding padding padding')
fake=mk('fake.pdf',b'this is not a pdf at all, just words words words')
txt=mk('a.txt',b'hello')
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    # clear win
    pg.goto(B+'/disputes/C10'); pg.wait_for_timeout(400)
    check('C10 shows Clear win', pg.get_by_text('Clear win').is_visible())
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(400)
    check('C04 has no Clear win', pg.get_by_text('Clear win').count()==0)
    # upload flow on C06
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(400)
    open_row(pg,'evidence')
    pg.get_by_role('button',name='+ Add evidence').click()
    open_row(pg,'evidence')
    pg.set_input_files('#ev-file',txt); check('wrong type refused in browser', pg.get_by_text('Use a PDF, PNG, JPEG or WebP file.').is_visible())
    open_row(pg,'evidence')
    pg.set_input_files('#ev-file',fake); pg.wait_for_timeout(600); check('wrong bytes refused by server', pg.get_by_text("doesn't look like its type").is_visible())
    open_row(pg,'evidence')
    pg.set_input_files('#ev-file',unr); pg.wait_for_timeout(600); check('unreadable message', pg.get_by_text("We couldn't read this file").is_visible())
    open_row(pg,'evidence')
    pg.set_input_files('#ev-file',card); pg.wait_for_timeout(600); check('card number in file refused', pg.get_by_text('shows a full card number').is_visible())
    open_row(pg,'evidence')
    pg.set_input_files('#ev-file',lng); pg.wait_for_timeout(600); check('long file truncated with note', pg.get_by_text('only the first 4,000 characters').is_visible() and pg.input_value('#ev-text').__len__()==4000)
    open_row(pg,'evidence')
    pg.set_input_files('#ev-file',good); pg.wait_for_timeout(600)
    open_row(pg,'evidence')
    check('title and text filled', pg.input_value('#ev-title')=='Billing audit log' and 'clicked Cancel subscription' in pg.input_value('#ev-text'))
    check('check-before-adding note', pg.get_by_text('Check the text before you add it.').is_visible())
    pg.get_by_role('button',name='Add evidence',exact=True).click()
    open_row(pg,'evidence')
    check('added as E5', pg.locator('#ev-E5').is_visible())
    pg.get_by_role('button',name=re.compile('(Run live|Re-run) check')).first.click()
    pg.get_by_text(f'Live: {MODEL}, prompt v2.3').wait_for(timeout=10000)
    check('uploaded evidence flips the call to Fold', pg.get_by_text('before the charge').first.is_visible())
    reqs=[json.loads(l) for l in open(D+'fake_requests.jsonl')]
    ex=[r for r in reqs if r['body']['tools'][0]['name']=='record_document_text']
    check('extraction used one forced tool and a document block', len(ex)>=1 and ex[0]['body']['tool_choice']['name']=='record_document_text' and ex[0]['body']['messages'][0]['content'][0]['type']=='document')
    # escalate with draft
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(300)
    open_row(pg,'evidence')
    pg.get_by_role('button',name='+ Add evidence').click(); pg.fill('#ev-title','Note'); pg.fill('#ev-text','ESCALATEME please')
    pg.get_by_role('button',name='Add evidence',exact=True).click()
    pg.get_by_role('button',name=re.compile('(Run live|Re-run) check')).first.click()
    pg.get_by_text(f'Live: {MODEL}, prompt v2.3').wait_for(timeout=10000)
    check('call is Escalate', pg.get_by_text('Escalate').first.is_visible() and pg.get_by_text('Get this first').is_visible())
    check('draft-ready note shown', pg.get_by_text('A draft contest is ready from what you have now').is_visible())
    pg.get_by_role('button',name=lambda n: False) if False else None
    pg.get_by_role('button',name='Fight anyway').click(); pg.wait_for_timeout(300)
    review(pg)
    check('review shows the escalate draft with the warning', pg.get_by_text('This draft uses only the documents you have now').is_visible() and 'charged USD 480' in pg.input_value('#draft'))
    check('draft sentences cited, no blocker text', pg.get_by_text('Add a source or remove this sentence').count()==0)
    # phone
    ph=ctx.new_page(); ph.set_viewport_size({'width':360,'height':800}); ph.goto(B+'/disputes/C06'); ph.wait_for_timeout(500); open_row(ph,'evidence'); ph.get_by_role('button',name='+ Add evidence').click(); ph.wait_for_timeout(300)
    check('no sideways scroll with upload form at 360px', not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
