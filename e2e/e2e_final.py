from playwright.sync_api import sync_playwright
B='http://localhost:3111'
ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n)
    if not c: ok=False
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(700)
    check('no low-odds note at the default 20% line (odds 88%)', pg.get_by_test_id('low-odds-note').count()==0)
    pg.evaluate("localStorage.setItem('da:v1:alerts', JSON.stringify({foldBelowPct:40})); localStorage.setItem('da:v1:ledger', JSON.stringify(Array.from({length:40},(_,i)=>({id:'X'+i,source:'you',code:'13.2',amountInr:50000,contestInr:50000,call:'fight',confidence:'High',action:'fight',outcome:'lost',onTime:true}))))")
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(700)
    check('after many lost fights, the note appears on a Fight call', pg.get_by_test_id('low-odds-note').count()==1 and 'still your call' in pg.get_by_test_id('low-odds-note').inner_text())
    pg.evaluate("localStorage.setItem('da:v1:alerts', JSON.stringify({foldBelowPct:null}))")
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(700)
    check('no note when the suggestion is switched off', pg.get_by_test_id('low-odds-note').count()==0)
    pg.get_by_role('button', name='Why AI, not a fixed checklist?').click() if pg.get_by_role('button', name='Why AI, not a fixed checklist?').count() else None
    pg.wait_for_timeout(300)
    t=pg.get_by_test_id('checklist-record')
    check('checklist track record shown', t.count()==1 and '23 (61%)' in t.inner_text() and 'Get a document' in t.inner_text())
    pg.goto(B+'/'); pg.wait_for_timeout(500)
    check('tour link says Take the tour', pg.get_by_role('button', name='Take the tour').count()>=1)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
