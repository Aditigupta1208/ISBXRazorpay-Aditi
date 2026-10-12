import json,urllib.request,re
from playwright.sync_api import sync_playwright
B='http://localhost:3111'; bad=0
def check(n,c):
    global bad
    print(('ok   ' if c else 'FAIL ')+n)
    if not c: bad+=1
def post(path,obj):
    r=urllib.request.Request(B+path,json.dumps(obj).encode(),{'content-type':'application/json'})
    try:
        with urllib.request.urlopen(r) as x: return x.status,json.loads(x.read())
    except urllib.error.HTTPError as e: return e.code,json.loads(e.read())
# headers
r=urllib.request.urlopen(B+'/disputes'); h={k.lower():v for k,v in r.headers.items()}
check('no X-Powered-By','x-powered-by' not in h)
check('X-Frame-Options DENY',h.get('x-frame-options')=='DENY')
check('nosniff',h.get('x-content-type-options')=='nosniff')
check('referrer policy','referrer-policy' in h)
check('CSP frame-ancestors none',"frame-ancestors 'none'" in h.get('content-security-policy',''))
# max 5 message
st,j=post('/api/analyze',{'caseId':'C06','added':[{'title':'t%d'%i,'content':'x'} for i in range(6)]})
check('six docs says at most 5',st==400 and 'at most 5' in j.get('message','') and j.get('code')=='too_many')
# bad requests must not use the hourly allowance
for i in range(25): post('/api/analyze',{'caseId':'C06','added':[{'title':'t','content':'4111 1111 1111 1111'}]})
st,j=post('/api/analyze',{'caseId':'C04','added':[]})
check('25 bad requests did not burn the limit',st==200)
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    pg=b.new_page(viewport={'width':1280,'height':800})
    pg.on('pageerror',lambda e:errs.append(str(e)[:100])); pg.on('console',lambda m:errs.append(m.text[:140]) if m.type=='error' else None)
    # CSP does not break pages
    for u in ['/','/disputes','/disputes/C06','/disputes/C15','/results','/alerts','/agent-studio','/how-it-works','/evals','/disputes/C06/packet']:
        pg.goto(B+u); pg.wait_for_timeout(500)
    check('no console/CSP errors across pages',errs==[]); 
    if errs: print(errs[:4])
    # evals sentence
    pg.goto(B+'/evals'); t=pg.inner_text('body')
    check('evals explains fraud cases not scored','2 fraud cases are sent to Chargeback Shield without a model call, so 38 are scored' in t)
    # why not fold + saved note
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(500)
    check('why-not-fold on Fight',pg.get_by_test_id('why-not-fold').count()==1 and 'key documents for 13.2' in pg.get_by_test_id('why-not-fold').inner_text())
    check('v2.3 stored run has no "older prompt" note',pg.get_by_test_id('saved-note').count()==0)
    pg.goto(B+'/disputes/C01'); pg.wait_for_timeout(500)
    check('saved note shown on an older stored result',pg.get_by_test_id('saved-note').count()==1)
    pg.goto(B+'/disputes/C15'); pg.wait_for_timeout(500)
    check('no why-not-fold on Escalate',pg.get_by_test_id('why-not-fold').count()==0)
    pg.goto(B+'/disputes/C16'); pg.wait_for_timeout(500)
    check('shield: no saved note, no alert link',pg.get_by_test_id('saved-note').count()==0 and pg.get_by_test_id('see-alert').count()==0)
    # alert link
    pg.goto(B+'/disputes/C10'); pg.wait_for_timeout(500)
    pg.get_by_test_id('see-alert').click(); pg.wait_for_url('**/alerts?focus=C10'); pg.wait_for_timeout(800)
    check('alerts focus note and ring',pg.get_by_test_id('focus-note').count()==1 and 'C10' in pg.get_by_test_id('focus-note').inner_text())
    check('focused alert has ring', 'ring-2' in (pg.locator('#alert-C10').get_attribute('class') or ''))
    pg.goto(B+'/alerts?focus=ZZ'); pg.wait_for_timeout(400)
    check('bad focus ignored',pg.get_by_test_id('focus-note').count()==0)
    # phone sticky summary
    m=b.new_page(viewport={'width':390,'height':844}); m.goto(B+'/disputes/C06'); m.wait_for_timeout(600)
    box=m.get_by_test_id('sticky-summary')
    check('phone: stake line visible',box.is_visible() and 'at stake' in box.inner_text() and 'left' in box.inner_text())
    check('desktop: stake line hidden',not pg.goto(B+'/disputes/C06') or not pg.get_by_test_id('sticky-summary').is_visible())
    b.close()
print('ALL OK' if not bad else 'SOME FAILED')
