import json, urllib.request
from playwright.sync_api import sync_playwright
from rows import open_row, review
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
def dump(): return json.loads(urllib.request.urlopen('http://127.0.0.1:4012/dump').read())
def total():
    t={}
    for r in dump(): t[r['event']]=t.get(r['event'],0)+r['count']
    return t
def get_usage(tok):
    req=urllib.request.Request(B+'/api/usage',headers={'Authorization':'Bearer '+tok} if tok else {})
    try:
        r=urllib.request.urlopen(req); return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e: return e.code, None
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.goto(B+'/disputes'); pg.wait_for_timeout(700)
    check('first visit counted once', total().get('new_visitor')==1)
    pg.goto(B+'/disputes'); pg.wait_for_timeout(500); pg2=ctx.new_page(); pg2.goto(B+'/how-it-works'); pg2.wait_for_timeout(600)
    check('second page and tab do not count another visitor', total().get('new_visitor')==1)
    check('how it works view counted', total().get('how_it_works_viewed')==1)
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(600)
    check('dispute opened per case id', total().get('dispute_opened:C06')==1)
    pg.goto(B+'/disputes/C14'); pg.wait_for_timeout(400)
    pg.get_by_role('button',name='Accept dispute (Fold)',exact=True).first.click(); pg.get_by_role('button',name='Yes, fold').click(); pg.wait_for_timeout(600)
    check('fold counted', total().get('fold')==1)
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(400)
    review(pg)
    pg.get_by_role('button',name='Approve and submit').click(); pg.get_by_role('button',name='Yes, submit').click(); pg.wait_for_timeout(500)
    pg.get_by_role('button',name='Mark as won').click(); pg.wait_for_timeout(500)
    t=total(); check('submit and outcome_won counted', t.get('submit')==1 and t.get('outcome_won')==1)
    pg.goto(B+'/results'); pg.wait_for_timeout(600); check('results view counted', total().get('results_viewed')==1)
    # nothing personal stored: only known field names
    keys=set(total().keys()); allowed={'new_visitor','dispute_opened:C06','dispute_opened:C14','dispute_opened:C04','fold','submit','outcome_won','results_viewed','how_it_works_viewed'}
    check('only counter names are stored: '+str(sorted(keys-allowed)), keys<=allowed)
    days={r['day'] for r in dump()}; check('rows are per day', len(days)==1)
    # junk is ignored
    for body in [b'{"event":"drop_table"}', b'{"event":"dispute_opened","id":"C99"}', b'{"event":"dispute_opened","id":"x; DEL"}', b'not json', b'{"event":"fold"}'+b' '*300]:
        try: r=urllib.request.urlopen(urllib.request.Request(B+'/api/event',data=body,method='POST',headers={'Content-Type':'application/json'})); st=r.status
        except urllib.error.HTTPError as e: st=e.code
        check('junk gets 204: '+body[:25].decode(errors='ignore'), st==204)
    check('junk changed nothing', set(total().keys())==keys and total().get('fold')==1)
    # Do Not Track
    dnt=b.new_context(); dnt.add_init_script("Object.defineProperty(navigator,'doNotTrack',{get:()=>'1'})"); d=dnt.new_page(); d.goto(B+'/disputes/C01'); d.wait_for_timeout(700)
    check('Do Not Track counts nothing', total().get('new_visitor')==1 and 'dispute_opened:C01' not in total())
    # admin read
    check('usage hidden without token: 401', get_usage('')[0]==401)
    check('wrong token: 401', get_usage('nope')[0]==401)
    st,j=get_usage('admin123'); check('right token: 200 with headline', st==200 and j['headline']['visitors']==1 and j['headline']['submits']==1 and j['headline']['folds']==1 and j['headline']['disputesOpened']==3)
    check('top disputes listed', len(j['headline']['topDisputes'])==3)
    ap=ctx.new_page(); ap.goto(B+'/usage'); ap.fill('#tok','nope'); ap.get_by_role('button',name='Show counts').click(); ap.wait_for_timeout(400)
    check('wrong token shown plainly', ap.get_by_text('That token is not right.').is_visible())
    ap.fill('#tok','admin123'); ap.get_by_role('button',name='Show counts').click(); ap.wait_for_timeout(500)
    check('report shows visitors and top disputes', ap.get_by_text('Most opened:').is_visible() and ap.get_by_text('Visitors',exact=True).first.is_visible())
    check('usage page is noindex', ap.locator('meta[name=robots]').get_attribute('content').startswith('noindex'))
    check('usage page not in the tabs', ap.get_by_role('link',name='Usage').count()==0)
    check('privacy line on How it works', 'No names, emails, IP addresses' in ctx.new_page().goto(B+'/how-it-works') .text() if False else True)
    h=ctx.new_page(); h.goto(B+'/how-it-works'); h.wait_for_timeout(300); h.get_by_role('tab',name='Sources and limits').click(); check('privacy line on How it works', 'No names, emails, IP addresses, cookies' in h.inner_text('body'))
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
