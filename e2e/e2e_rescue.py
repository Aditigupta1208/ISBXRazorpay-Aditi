import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
import sys, json
from playwright.sync_api import sync_playwright
from rows import review
mode = sys.argv[1] if len(sys.argv) > 1 else 'none'
ok = True
def check(n, c):
    global ok; print(('PASS ' if c else 'FAIL ') + n); ok = ok and bool(c)
B = 'http://localhost:3111'
LOG = (HERE+'/fake_requests.jsonl')
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1280, 'height': 900}); pg = ctx.new_page()
    # ---- tour step 6 shows a saved example result, with no model call
    if mode == 'live': open(LOG, 'w').write('')
    pg.goto(B + '/disputes/C06'); pg.wait_for_timeout(500)
    pg.get_by_role('button', name='Take the 2-minute tour').first.click() if pg.get_by_role('button', name='Take the 2-minute tour').count() else pg.get_by_role('link', name='Take the 2-minute tour').first.click()
    pg.wait_for_url(B + '/'); pg.wait_for_timeout(700)
    card = pg.get_by_role('region', name='Guided tour')
    for i in range(5):
        card.get_by_role('button', name='Next').click(); pg.wait_for_timeout(1100)
    check('tour is on step 6, the bank test', '6 of 12' in card.inner_text().lower() and 'bank' in card.inner_text().lower())
    pg.wait_for_timeout(1200)
    check('step 6 shows a result, not an empty panel', pg.get_by_test_id('rebuttal-result').is_visible())
    check('result is the saved example, labelled', pg.get_by_test_id('rebuttal-result').get_by_text('Saved example, written by the builder. Not a live check.').is_visible())
    sp = pg.locator('[data-tour-spot]').bounding_box(); box = card.bounding_box()
    ov = not (sp['x']+sp['width'] <= box['x'] or box['x']+box['width'] <= sp['x'] or sp['y']+sp['height'] <= box['y'] or box['y']+box['height'] <= sp['y'])
    check('card does not cover the result', not ov)
    if mode == 'live':
        n = [l for l in open(LOG) if l.strip()]
        check('the tour made no model call', len(n) == 0)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)

    # ---- worth finding on Escalate
    pg.goto(B + '/disputes/C15'); pg.wait_for_timeout(600)
    wf = pg.get_by_test_id('worth-finding')
    check('C15 shows Worth finding', wf.is_visible() and 'Worth asking' in wf.inner_text())
    wf.locator('summary').click(); t = wf.inner_text()
    check('it is a ceiling, in rupees, with odds and the effort cost', 'Up to ₹' in t and '% odds' in t and 'effort cost' in t and 'A ceiling, not a forecast.' in t)
    pg.goto(B + '/disputes/C02'); pg.wait_for_timeout(500)
    check('C02 shows it too', pg.get_by_test_id('worth-finding').is_visible())
    for cid in ['C06', 'C14', 'C16']:
        pg.goto(B + f'/disputes/{cid}'); pg.wait_for_timeout(400)
        check(f'{cid} does not show Worth finding', pg.get_by_test_id('worth-finding').count() == 0)

    # ---- Deadline rescue (now on the Alerts page)
    pg.goto(B + '/agent-studio'); pg.wait_for_timeout(500)
    check('Agent setup no longer has a duplicate WhatsApp toggle', pg.get_by_label('Deadline rescue: WhatsApp me when a deadline is under 24 hours').count() == 0 and pg.get_by_test_id('rescue-message').count() == 0)
    check('Agent setup points to Alerts', pg.get_by_role('link', name='Open Alerts').is_visible())
    pg.goto(B + '/alerts'); pg.wait_for_timeout(600)
    pg.evaluate("localStorage.removeItem('da:v1:da:v1:C06'); localStorage.removeItem('da:v1:C06')")
    lk = pg.get_by_test_id('review-link').first
    check('an urgent Fight alert has Review and approve', lk.is_visible())
    href = lk.get_attribute('href')
    lk.click(); pg.wait_for_url('**' + href); pg.wait_for_timeout(900)
    check('the link opens the response for review', pg.locator('#response').is_visible() and pg.get_by_role('button', name='Approve and submit').is_visible())
    check('nothing was submitted by the link', pg.get_by_text('Response submitted (simulated)').count() == 0 and pg.get_by_role('button', name='Approve and submit').is_enabled())
    pg.goto(B + '/disputes/C14?review=1'); pg.wait_for_timeout(600)
    check('?review=1 is ignored on a Fold call', pg.locator('#response').count() == 0)
    ph = b.new_context(viewport={'width': 360, 'height': 800}).new_page(); ph.goto(B + '/alerts'); ph.wait_for_timeout(500)
    check('no sideways scroll on Alerts at 360px', not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    h = ph.get_by_test_id('review-link').first.bounding_box()['height']
    check('review link is a 44px target', h >= 44)

    # ---- where it could go next
    pg.goto(B + '/how-it-works#next'); pg.wait_for_timeout(600)
    sec = pg.locator('#next')
    check('where it could go next is on How it works', sec.is_visible() and 'not built' in sec.inner_text().lower())
    check('three ideas', sec.locator('h3').count() == 3)
    check('the cover idea is marked as risky', 'Needs outcome data first' in sec.inner_text())
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
