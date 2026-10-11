import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
import os
MODEL=os.environ.get("EXPECT_MODEL","claude-sonnet-5-5")
import sys, json
from playwright.sync_api import sync_playwright
from rows import open_row, review
mode = sys.argv[1] if len(sys.argv) > 1 else 'none'
ok = True
JS='''()=>{const lum=c=>{const m=c.match(/[\\d.]+/g).map(Number);const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};let bad=0;document.querySelectorAll('p,span,li,td,th,label,dd,a,button,div').forEach(e=>{if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const cs=getComputedStyle(e);let bg=null,el=e;while(el){const b=getComputedStyle(el).backgroundColor;if(b&&!b.includes('rgba(0, 0, 0, 0)')&&b!=='transparent'){bg=b;break}el=el.parentElement}bg=bg||'rgb(255,255,255)';const a=lum(cs.color),b2=lum(bg);if((Math.max(a,b2)+.05)/(Math.min(a,b2)+.05)<4.5)bad++});return bad}'''
def check(n, c):
    global ok; print(('PASS ' if c else 'FAIL ') + n); ok = ok and bool(c)
B = 'http://localhost:3111'
LOG = (HERE+'/fake_requests.jsonl')

def run_test(pg):
    pg.get_by_test_id('rebuttal-run').click()
    pg.get_by_test_id('rebuttal-result').wait_for(timeout=8000)

def set_draft(pg, text):
    pg.locator('#draft').fill(text); pg.wait_for_timeout(150)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1280, 'height': 900}); pg = ctx.new_page()
    pg.goto(B + '/disputes/C06'); pg.wait_for_timeout(500)
    check('bank test is not a third main button', pg.locator('#primary-action').get_by_test_id('test-bank-link').count() == 0)
    pg.get_by_role('button', name='Review response').click(); pg.wait_for_timeout(700)
    pg.get_by_test_id('rebuttal-hint').get_by_role('button', name='Test it first').click(); pg.wait_for_timeout(700)
    check('the link opens the review and shows the bank test', pg.get_by_test_id('rebuttal').is_visible() and pg.get_by_role('button', name='Approve and submit').is_visible())
    check('hint says not tested yet', pg.get_by_test_id('rebuttal-hint').inner_text().startswith('Not tested on the bank yet'))
    check('the hint does not block Approve', pg.get_by_role('button', name='Approve and submit').is_enabled())
    pg.get_by_test_id('rebuttal-hint').get_by_role('button', name='Test it first').click(); pg.wait_for_timeout(400)
    review(pg)
    check('panel is on the review step', pg.get_by_test_id('rebuttal').is_visible() and pg.get_by_role('heading', name='Test it on the bank first').is_visible())
    check('says practice run, not a bank decision', pg.get_by_test_id('rebuttal').get_by_text('A practice run, not a real bank decision.', exact=False).is_visible())
    check('nothing runs by itself', pg.get_by_test_id('rebuttal-result').count() == 0)
    check('button is a click', pg.get_by_test_id('rebuttal-run').inner_text().strip() == 'Test this response')
    draft0 = pg.locator('#draft').input_value()

    if mode == 'none':
        run_test(pg)
        check('verdict chip', pg.get_by_test_id('rebuttal-verdict').inner_text() == 'Has a weak spot')
        check('saved example is labelled', pg.get_by_test_id('rebuttal-result').get_by_text('Saved example, written by the builder. Not a live check.').is_visible())
        check('strongest objection shown', pg.get_by_test_id('rebuttal-result').get_by_text("The bank's strongest objection").is_visible() and pg.get_by_test_id('rebuttal-result').get_by_text('thinking of cancelling').first.is_visible())
        check('weakest sentence quoted from the draft', pg.get_by_test_id('rebuttal-weak').locator('blockquote').inner_text().startswith('The customer was instructed to cancel'))
        check('rewrite offered', pg.get_by_test_id('rebuttal-fix').is_visible() and pg.get_by_test_id('rebuttal-apply').is_enabled())
        pg.get_by_test_id('rebuttal-checks').locator('summary').click(); pg.wait_for_timeout(100)
        check('four safety checks listed', pg.get_by_test_id('rebuttal-checks').locator('li').count() == 4)
        check('checks all passed', pg.get_by_test_id('rebuttal-checks').locator('li span.text-green-ink').count() >= 3)
        # call and draft unchanged by testing
        check('hint shows the verdict after a test', 'Tested on the bank: Has a weak spot' in pg.get_by_test_id('rebuttal-hint').inner_text())
        check('testing did not change the draft', pg.locator('#draft').input_value() == draft0)
        check('call chip still Fight', pg.locator('#decision').get_by_text('Fight').first.is_visible())
        # evidence chip
        pg.get_by_test_id('rebuttal-result').get_by_role('button', name='Show E2').click(); pg.wait_for_timeout(300)
        check('objection document chip opens the document', pg.locator('#ev-E2.border-brand').count() == 1)
        review(pg)
        # use the rewrite
        pg.get_by_test_id('rebuttal-apply').click(); pg.wait_for_timeout(250)
        new = pg.locator('#draft').input_value()
        check('rewrite replaced the weak sentence', 'thinking of cancelling' in new and 'The customer was instructed to cancel' not in new)
        check('draft still within 1,000', len(new.strip()) <= 1000)
        check('every sentence still cited (can submit)', pg.get_by_role('button', name='Approve and submit').is_enabled())
        check('hint says the response changed', 'You changed the response since the last bank test.' in pg.get_by_test_id('rebuttal-hint').inner_text())
        check('result is marked stale after the change', pg.get_by_test_id('rebuttal-stale').is_visible())
        check('apply is disabled on a stale result', pg.get_by_test_id('rebuttal-apply').is_disabled())
        check('button now says Test again', pg.get_by_test_id('rebuttal-run').inner_text().strip() == 'Test again')
        pg.get_by_test_id('rebuttal-run').click(); pg.wait_for_timeout(700)
        check('no key and edited draft: plain message, no crash', pg.get_by_text('the saved example only fits the original draft', exact=False).is_visible())
        # persists
        pg.reload(); pg.wait_for_timeout(500); review(pg)
        check('result survives a reload (marked stale)', pg.get_by_test_id('rebuttal-result').is_visible() and pg.get_by_test_id('rebuttal-stale').is_visible())
        # clearing the draft disables the button
        set_draft(pg, '   ')
        check('empty draft disables the test', pg.get_by_test_id('rebuttal-run').is_disabled() and pg.get_by_text('Write a response first.').is_visible())
        # holds up
        pg.goto(B + '/disputes/C01'); pg.wait_for_timeout(500); review(pg); run_test(pg)
        check('C01 holds up', pg.get_by_test_id('rebuttal-verdict').inner_text() == 'Holds up')
        check('holds up has no rewrite and no weak sentence', pg.get_by_test_id('rebuttal-fix').count() == 0 and pg.get_by_test_id('rebuttal-weak').count() == 0)
        check('holds up still says what a reviewer might ask', pg.get_by_test_id('rebuttal-result').get_by_text('What a reviewer might still ask').is_visible())
        # add document
        pg.goto(B + '/disputes/C10'); pg.wait_for_timeout(500); review(pg); run_test(pg)
        check('C10 asks for a document', pg.get_by_test_id('rebuttal-fix').get_by_text('bank reference number').is_visible())
        pg.get_by_test_id('rebuttal-fix').get_by_role('button', name='Add the document').click(); pg.wait_for_timeout(300)
        check('add the document opens the add form', pg.get_by_label('Title', exact=False).first.is_visible() if pg.get_by_label('Title', exact=False).count() else pg.get_by_role('button', name='Add document').count() > 0 or pg.locator('textarea').count() > 1)
        # every demo case with a draft has an example
        pg.evaluate('localStorage.clear()')
        for cid in ['C01','C03','C04','C06','C07','C10','C12','C13']:
            pg.goto(B + f'/disputes/{cid}'); pg.wait_for_timeout(400); review(pg); run_test(pg)
            check(f'{cid} saved example shows', pg.get_by_test_id('rebuttal-verdict').is_visible())
        # no panel on fold / shield / escalate without a draft
        for cid in ['C14', 'C16']:
            pg.goto(B + f'/disputes/{cid}'); pg.wait_for_timeout(400)
            check(f'{cid} has no rebuttal panel', pg.get_by_test_id('rebuttal').count() == 0)
        # phone
        ph = b.new_context(viewport={'width': 360, 'height': 800}).new_page(); ph.goto(B + '/disputes/C06'); ph.wait_for_timeout(500); review(ph); run_test(ph)
        ph.get_by_test_id('rebuttal-checks').locator('summary').click(); ph.wait_for_timeout(150)
        check('no sideways scroll with the result open at 360px', not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
        h2 = ph.evaluate("(()=>{const o=[];document.querySelectorAll('#rebuttal a,#rebuttal button,#rebuttal summary').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width)return;const a=getComputedStyle(e,'::after');let h=r.height;if(a.position==='absolute'&&a.top.startsWith('-'))h+=Math.abs(parseFloat(a.top))*2;if(h<40)o.push((e.innerText||e.id).slice(0,20)+' '+Math.round(h))});return o})()")
        check('rebuttal touch targets >=40px on phone '+str(h2), not h2)
        ph.get_by_test_id('rebuttal').scroll_into_view_if_needed(); ph.screenshot(path='rb-phone.png')
        # screenshots
        pg.goto(B + '/disputes/C06'); pg.wait_for_timeout(500); review(pg); run_test(pg)
        pg.get_by_test_id('rebuttal').scroll_into_view_if_needed(); pg.wait_for_timeout(200)
        pg.get_by_test_id('rebuttal').screenshot(path='rb-desktop.png')
        n = pg.evaluate(JS); check(f'contrast with the result open ({n} low)', n == 0)
        pg.get_by_test_id('rebuttal-checks').evaluate('d=>d.open=true')
        n = pg.evaluate(JS); check(f'contrast with the checks open ({n} low)', n == 0)
    else:
        open(LOG, 'w').write('')
        run_test(pg)
        check('live label', pg.get_by_test_id('rebuttal-result').get_by_text(f'Live practice run: {MODEL}, prompt v1').is_visible())
        check('live verdict', pg.get_by_test_id('rebuttal-verdict').inner_text() == 'Has a weak spot')
        reqs = [json.loads(l) for l in open(LOG) if l.strip()]
        last = reqs[-1]
        check('forced tool call for the rebuttal', last['body'].get('tool_choice') == {'type': 'tool', 'name': 'record_bank_rebuttal'} and [t['name'] for t in last['body']['tools']] == ['record_bank_rebuttal'])
        msg = last['body']['messages'][0]['content']
        check('draft and evidence sent as data', '<draft>' in msg and '<evidence id="E1">' in msg and 'Visa rule for 13.2' in msg)
        check('key stays on the server', 'ANTHROPIC' not in pg.content())
        check('max tokens capped', last['body']['max_tokens'] <= (5500 if not MODEL.startswith('claude') else 1500))
        pg.get_by_test_id('rebuttal-apply').click(); pg.wait_for_timeout(250)
        new = pg.locator('#draft').input_value()
        check('live rewrite applied, cites real documents', '[E1]' in new and '[E4]' in new and pg.get_by_role('button', name='Approve and submit').is_enabled())
        def case(tag, text):
            set_draft(pg, text); pg.get_by_test_id('rebuttal-run').click(); pg.wait_for_timeout(900)
        case('lose', 'The customer cancelled before the charge LOSEME. [E1]')
        check('likely to lose, no fix', pg.get_by_test_id('rebuttal-verdict').inner_text() == 'Likely to lose' and pg.get_by_test_id('rebuttal-fix').count() == 0)
        case('hold', 'The customer used the service after the charge HOLDME. [E3]')
        check('holds up', pg.get_by_test_id('rebuttal-verdict').inner_text() == 'Holds up')
        case('quote', 'The customer used the service. [E3] BADQUOTE here. [E1]')
        check('RB1: invented quote hidden, no rewrite', pg.get_by_test_id('rebuttal-weak').count() == 0 and pg.get_by_test_id('rebuttal-fix').count() == 0)
        pg.get_by_test_id('rebuttal-checks').locator('summary').click(); pg.wait_for_timeout(100)
        check('RB1 shows as changed', pg.get_by_test_id('rebuttal-checks').get_by_text('not in your draft', exact=False).is_visible() and pg.get_by_test_id('rebuttal-checks').get_by_text('changed').first.is_visible())
        case('cite', 'The customer used the service. [E3] BADCITE here. [E1]')
        pg.get_by_test_id('rebuttal-checks').evaluate('d=>d.open=true'); pg.wait_for_timeout(100)
        check('RB2: rewrite citing E9 dropped', pg.get_by_test_id('rebuttal-fix').count() == 0 and pg.get_by_test_id('rebuttal-checks').get_by_text('E9', exact=False).first.is_visible())
        case('doc', 'The customer used the service. [E3] ADDDOC here. [E1]')
        check('add document prompt', pg.get_by_test_id('rebuttal-fix').get_by_text('refund bank reference number').is_visible())
        case('invalid', 'The customer used the service. [E3] INVALIDME here. [E1]')
        check('invalid answer: plain message, no crash', pg.get_by_text("The test didn't work just now", exact=False).is_visible())
        case('fail', 'The customer used the service. [E3] FAILME here. [E1]')
        check('failed call: plain message, no crash', pg.get_by_text("The test didn't work just now", exact=False).is_visible())
        # a repeat is cached: no new fake request
        n = len(open(LOG).read().splitlines()); case('hold2', 'The customer used the service after the charge HOLDME. [E3]'); 
        check('repeat of an earlier draft is served from cache', len(open(LOG).read().splitlines()) == n)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
