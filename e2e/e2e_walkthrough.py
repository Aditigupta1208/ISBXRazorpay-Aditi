from playwright.sync_api import sync_playwright
B='http://localhost:3111'
ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n)
    if not c: ok=False
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    # alerts: defaults, rules sentence, connect note
    pg.goto(B+'/alerts'); pg.wait_for_timeout(600)
    check('default urgent hours is 24', pg.get_by_label('Urgent hours').input_value()=='24')
    check('default amount is 10,000', pg.get_by_label('Alert amount in rupees').input_value()=='10,000')
    check('36 hours is an option', pg.get_by_label('Urgent hours').locator('option[value="36"]').count()==1)
    check('rules sentence says any one', 'any one of these' in pg.get_by_test_id('rules-combine').inner_text())
    pg.get_by_label('Slack').check(force=True); pg.wait_for_timeout(200)
    check('connect note names Slack and says preview', 'Slack' in pg.get_by_test_id('connect-note').inner_text() and 'Preview only' in pg.get_by_test_id('connect-note').inner_text())
    pg.get_by_label('Email').check(force=True); pg.wait_for_timeout(200)
    check('no connect note on email', pg.get_by_test_id('connect-note').count()==0)
    # case: whatsapp share link and the demo outcome box
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(600)
    check('Send on WhatsApp is next to Copy a summary', pg.get_by_test_id('share-whatsapp').is_visible() and pg.get_by_test_id('copy-summary').is_visible())
    pg.evaluate("window.__opened=[]; window.open=function(){window.__opened.push(Array.prototype.slice.call(arguments)); return null}")
    pg.get_by_test_id('share-whatsapp').click(); pg.wait_for_timeout(200)
    a=pg.evaluate("window.__opened.filter(x=>x[0]&&String(x[0]).startsWith('https://wa.me/'))[0]")
    check('opens wa.me with the summary text, no opener', a and a[0].startswith('https://wa.me/?text=') and 'Fight' in a[0] and 'noopener' in a[2])
    pg.get_by_role('button',name='Review response').click(); pg.wait_for_timeout(500)
    pg.get_by_role('button',name='Approve and submit').click(); pg.get_by_role('button',name='Yes, submit').click(); pg.wait_for_timeout(500)
    box=pg.get_by_test_id('demo-outcome')
    check('outcome buttons sit in a box labelled demo only', box.is_visible() and 'Demo only.' in box.inner_text() and 'the bank decides' in box.inner_text())
    check('buttons still there', box.get_by_role('button',name='Mark as won').is_visible())
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
