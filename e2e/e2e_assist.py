import sys
from playwright.sync_api import sync_playwright
from rows import open_row, review
B='http://localhost:3111'; ok=True
MODE=sys.argv[1] if len(sys.argv)>1 else 'live'
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
S=["The customer accepted the renewal terms on 3 Aug 2025 and was told how to cancel. [E1]",
   "On 29 Jul 2026 the customer only said they were thinking of cancelling and sent no further messages. [E2]",
   "The customer last logged in on 28 Jul 2026 and never logged in again. [E3]",
   "The billing audit log records no cancellation action at all before the charge. [E4]"]
LONG=" ".join(S+[S[3].replace("at all before","once more before")]*12)
assert len(LONG)>1000
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(600); review(pg)
    ta=pg.locator('#draft')
    check('no shorten box while the draft fits', pg.get_by_test_id('shorten-box').count()==0)
    ta.fill(LONG); pg.wait_for_timeout(200)
    check('shorten box appears when over 1,000', pg.get_by_test_id('shorten-box').is_visible() and 'characters too long' in pg.get_by_test_id('shorten-box').inner_text())
    pg.get_by_role('button',name='Shorten it for me').click()
    pg.get_by_test_id('shorten-result').wait_for(timeout=15000)
    r=pg.get_by_test_id('shorten-result').inner_text()
    if MODE=='live': check('result says AI and names the model', 'by AI (qwen/qwen3.8-27b' in r)
    else: check('no key: made by code, no AI', 'made by code, no AI' in r and 'Sentences dropped' in r)
    check('textarea unchanged until chosen', len(ta.input_value())==len(LONG))
    pg.get_by_role('button',name='Keep mine').click(); pg.wait_for_timeout(150)
    check('keep mine closes the proposal, draft untouched', pg.get_by_test_id('shorten-result').count()==0 and len(ta.input_value())==len(LONG))
    pg.get_by_role('button',name='Shorten it for me').click(); pg.get_by_test_id('shorten-result').wait_for(timeout=15000)
    pg.get_by_role('button',name='Use this version').click(); pg.wait_for_timeout(300)
    v=ta.input_value()
    check('use this version replaces the draft, now within 1,000', 0<len(v)<=1000 and len(v)<len(LONG))
    check('shorten box gone once it fits', pg.get_by_test_id('shorten-box').count()==0)
    check('every sentence of the result still ends with a source', all(s.rstrip().endswith(']') or s.rstrip().endswith('].') for s in [x for x in v.replace('] ','].|').split('|') if x.strip()]))
    check('draft counter is not red', 'text-escalate' not in (pg.locator('#draft-help span').nth(1).get_attribute('class') or ''))
    if MODE=='live':
        ta.fill(LONG+" SHORTBAD"); pg.wait_for_timeout(200)
        pg.get_by_role('button',name='Shorten it for me').click(); pg.get_by_test_id('shorten-result').wait_for(timeout=20000)
        check('a made-up number from the model is refused, code trims instead', 'made by code, no AI' in pg.get_by_test_id('shorten-result').inner_text())
        pg.get_by_role('button',name='Keep mine').click()
    # key facts
    pg.reload(); pg.wait_for_timeout(600); open_row(pg,'evidence')
    check('no key facts before asking', pg.get_by_test_id('keyfacts-E1').count()==0)
    pg.get_by_role('button',name='Read key facts').click()
    pg.get_by_test_id('keyfacts-E1').wait_for(timeout=15000)
    src=pg.get_by_test_id('keyfacts-source').inner_text()
    print('SRC:',src)
    check('facts under every document', all(pg.get_by_test_id(f'keyfacts-E{i}').count()==1 for i in (1,2,3,4)))
    if MODE=='live': check('source line names the live model', 'Key facts by AI (qwen/qwen3.8-27b' in src)
    else: check('no key: saved example label', 'Saved example, written for this demo' in src)
    pg.locator('[data-testid="keyfacts-E4"] summary').first.click(); pg.wait_for_timeout(100)
    check('quote opens', 'no cancellation action recorded' in pg.get_by_test_id('keyfacts-E4').inner_text().lower() or 'billing' in pg.get_by_test_id('keyfacts-E4').inner_text().lower())
    pg.reload(); pg.wait_for_timeout(600); open_row(pg,'evidence')
    check('facts survive a reload', pg.get_by_test_id('keyfacts-E1').count()==1)
    if MODE!='live':
        pg.goto(B+'/disputes/C02'); pg.wait_for_timeout(600); open_row(pg,'evidence')
        pg.get_by_role('button',name='Read key facts').click(); pg.wait_for_timeout(1500)
        check('no key, no saved example: says it is off', 'off in this demo' in pg.inner_text('body'))
    # learning
    pg.goto(B+'/results'); pg.wait_for_timeout(700)
    check('learn box shows a button first', pg.get_by_role('button',name='Suggest a change').is_visible() and pg.get_by_test_id('learn-result').count()==0)
    pg.get_by_role('button',name='Suggest a change').click(); pg.get_by_test_id('learn-result').wait_for(timeout=15000)
    t=pg.get_by_test_id('learn-result').inner_text(); ls=pg.get_by_test_id('learn-source').inner_text()
    if MODE=='live': check('live: weakest code 13.7 from the counts, labelled AI and checked', '13.7' in t and 'Suggested by AI (qwen/qwen3.8-27b' in ls and 'checked against the counts' in ls)
    else: check('no key: saved example for the sample counts', 'Saved example, written for this demo' in ls and '13.7: won 1 of 2' in t and '13.3: won 2 of 3' in t)
    check('small sample is flagged', 'Small sample' in t)
    pg.get_by_role('button',name='Ask again').click(); pg.wait_for_timeout(150)
    check('ask again returns to the button', pg.get_by_role('button',name='Suggest a change').is_visible())
    # own record changes the counts: the saved example no longer fits
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(500); review(pg)
    pg.get_by_role('button',name='Approve and submit').click(); pg.get_by_role('button',name='Yes, submit').click(); pg.wait_for_timeout(300)
    pg.get_by_role('button',name='Mark as won').click(); pg.wait_for_timeout(300)
    pg.goto(B+'/results'); pg.wait_for_timeout(700)
    pg.get_by_role('button',name='Suggest a change').click(); pg.wait_for_timeout(2500)
    body=pg.inner_text('body')
    if MODE=='live': check('live with your own results still works', pg.get_by_test_id('learn-result').count()==1)
    else: check('no key + your own results: saved example is not shown for different counts', pg.get_by_test_id('learn-result').count()==0 and 'fits only the sample history' in body)
    check('no page errors', not errs)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
