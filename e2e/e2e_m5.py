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
LOG=(HERE+'/fake_requests.jsonl')
B='http://localhost:3111'
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.goto(B+'/disputes')
    for t in ['Agent setup','Evals','How it works']:
        check('tab '+t, pg.get_by_role('link',name=t).is_visible())
    pg.get_by_role('link',name='Agent setup').click(); pg.wait_for_url('**/agent-studio')
    check('active tab marked', pg.get_by_role('link',name='Agent setup').get_attribute('aria-current')=='page')
    pg.fill('#policy','Plans renew yearly. Cancel before renewal.')
    pg.select_option('#acceptance','checkbox')
    pg.fill('#policy','4111 1111 1111 1111')
    check('card number warned', pg.get_by_text('That looks like a card number').is_visible())
    check('card number: not used yet', pg.get_by_text('Not used yet').is_visible())
    pg.fill('#policy','Plans renew yearly. Cancel before renewal.')
    check('saved message', pg.get_by_text('Saved in this browser.').is_visible())
    pg.reload(); pg.wait_for_timeout(400)
    check('policy persists after reload', pg.input_value('#policy').startswith('Plans renew yearly'))
    check('acceptance persists', pg.input_value('#acceptance')=='checkbox')
    pg.fill('#policy','x'*1001)
    check('over-cap: not used yet', pg.get_by_text('Not used yet').is_visible())
    pg.fill('#policy','Plans renew yearly. Cancel before renewal.')
    # policy reaches the model
    pg.goto(B+'/disputes/C06')
    open_row(pg,'evidence')
    pg.get_by_role('button',name='+ Add evidence').click(); pg.fill('#ev-title','Billing audit log'); pg.fill('#ev-text','30 Jul 2026: customer clicked Cancel subscription')
    pg.get_by_role('button',name='Add evidence',exact=True).click()
    pg.get_by_role('button',name=re.compile('(Run live|Re-run) check')).first.click()
    pg.get_by_text(f'Live: {MODEL}, prompt v2.3').wait_for(timeout=10000)
    last=[json.loads(l) for l in open(LOG)][-1]
    u=last['body']['messages'][0]['content']; u=u if isinstance(u,str) else json.dumps(u)
    check('model got merchant_policy tag', '<merchant_policy accepted_by="Checkbox at checkout">Plans renew yearly' in u)
    check('policy marked as claim not proof', 'not proof' in u)
    # off switch
    n=len(open(LOG).read().splitlines())
    pg.goto(B+'/agent-studio'); pg.get_by_role('switch').uncheck(); pg.wait_for_timeout(200)
    check('status text off', pg.get_by_text('Dispute Advisor is off').is_visible())
    pg.goto(B+'/disputes/C04')
    open_row(pg,'evidence')
    pg.get_by_role('button',name='+ Add evidence').click(); pg.fill('#ev-title','Note'); pg.fill('#ev-text','hello')
    pg.get_by_role('button',name='Add evidence',exact=True).click()
    pg.get_by_role('button',name=re.compile('(Run live|Re-run) check')).first.click()
    check('off notice shown', pg.get_by_text('Dispute Advisor is off in Agent setup').is_visible())
    check('no call made while off', len(open(LOG).read().splitlines())==n)
    # how it works
    pg.goto(B+'/how-it-works')
    check('7 answers', pg.locator('#panel-answers dl').first.locator('dt').count()==7)
    check('5 flow steps', pg.locator('ol[aria-label=Flow] li').count()==5)
    # phone overflow
    for path in ['/agent-studio','/how-it-works','/evals']:
        ph=ctx.new_page(); ph.set_viewport_size({'width':360,'height':800}); ph.goto(B+path); ph.wait_for_timeout(300)
        check('no sideways scroll at 360px '+path, not ph.evaluate('document.documentElement.scrollWidth>innerWidth')); ph.close()
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
