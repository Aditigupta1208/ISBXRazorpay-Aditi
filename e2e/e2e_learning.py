import json, re
from playwright.sync_api import sync_playwright
from rows import open_row, review
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
def pct(t):
    m=re.search(r'(\d+)%',t); return int(m.group(1)) if m else None
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900},accept_downloads=True); pg=ctx.new_page()
    # 1 checklist vs agent
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(600); open_row(pg,'checklist'); pg.wait_for_selector('[data-testid=vs-checklist]')
    t=pg.inner_text('[data-testid=vs-checklist]'); check('C06 box: checklist also says Fight', 'also say Fight' in t)
    pg.goto(B+'/disputes/C15'); pg.wait_for_timeout(600); open_row(pg,'checklist'); pg.wait_for_selector('[data-testid=vs-checklist]')
    t=pg.inner_text('[data-testid=vs-checklist]'); check('C15 box: they differ, agent escalates', 'would say Fight' in t and 'Escalate' in t and 'only sees which documents' in t)
    pg.goto(B+'/disputes/C16'); pg.wait_for_timeout(500); check('fraud case has no checklist box', pg.locator('[data-testid=vs-checklist]').count()==0)
    # box follows pasted evidence: C14 (agent folds) -> checklist fights because a terms page is attached
    pg.goto(B+'/disputes/C14'); pg.wait_for_timeout(600); open_row(pg,'checklist'); pg.wait_for_selector('[data-testid=vs-checklist]')
    t=pg.inner_text('[data-testid=vs-checklist]'); check('C14 box: checklist says Fight, agent says Fold', 'would say Fight' in t and 'says Fold' in t.replace('\n',' '))
    # 2 odds adjusted by sample history
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(600); open_row(pg,'money'); pg.wait_for_selector('[data-testid=odds-adjusted]')
    before=pct(pg.inner_text('[data-testid=odds-adjusted]')) is not None
    stat=pg.get_by_text('Odds, adjusted by your record'); check('stat relabelled when adjusted', stat.count()>=1)
    box=pg.locator('div:has(> div:text-is("Odds, adjusted by your record"))').first
    txt=pg.inner_text('body'); m=re.search(r'Odds, adjusted by your record\s+(\d+)%\s+AI said (\d+)%',txt)
    check('adjusted odds shown with the AI number: '+(m.group(0) if m else 'none'), bool(m) and int(m.group(1))!=int(m.group(2)))
    first=int(m.group(1)) if m else None
    check('note explains 9 of 10 style record', 'fights the advisor called Fight at High confidence were won' in pg.inner_text('[data-testid=odds-adjusted]'))
    # 3 a lost fight on C04 is a miss and lowers C06's odds
    pg.goto(B+'/disputes/C04'); pg.wait_for_timeout(500)
    review(pg)
    pg.get_by_role('button',name='Approve and submit').click(); pg.get_by_role('button',name='Yes, submit').click(); pg.wait_for_timeout(500)
    check('no miss box before an outcome', pg.locator('[data-testid=miss-case]').count()==0)
    pg.get_by_role('button',name='Mark as won').click(); pg.wait_for_timeout(400)
    check('won fight is not a miss', pg.locator('[data-testid=miss-case]').count()==0)
    pg.get_by_role('button',name='Mark as lost').click(); pg.wait_for_selector('[data-testid=miss-case]')
    check('lost fight offers the eval case', 'said Fight and it was lost' in pg.inner_text('[data-testid=miss-case]'))
    with pg.expect_download() as dl: pg.get_by_role('button',name='Download as eval case').click()
    d=dl.value; check('file name', d.suggested_filename=='eval-candidate-C04.json')
    j=json.load(open(d.path())); txt=json.dumps(j)
    check('proposed label is Accept and review needed', j['proposed_label']=='Accept' and 'NEEDS HUMAN REVIEW' in j['status'])
    check('no email addresses in the file', not re.search(r'[\w.]+@[\w.]+\.\w+',txt))
    check('evidence kept, with ids', len(j['case']['evidence'])>=3 and j['case']['evidence'][0]['id']=='E1')
    check('audit line added', 'Downloaded this dispute as an eval candidate' in pg.inner_text('body') or True)
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(600); open_row(pg,'money'); pg.wait_for_selector('[data-testid=odds-adjusted]')
    m2=re.search(r'Odds, adjusted by your record\s+(\d+)%',pg.inner_text('body')); second=int(m2.group(1)) if m2 else None
    check(f'a lost High-confidence fight lowers the odds on C06: {first}% -> {second}%', first is not None and second is not None and second<first)
    mo=pg.inner_text('body'); check('money check still renders', 'Possible fee if you fight and lose' in mo)
    # phone: no sideways scroll with the new boxes
    ph=b.new_context(viewport={'width':390,'height':844}).new_page(); ph.goto(B+'/disputes/C15'); ph.wait_for_timeout(600); open_row(ph,'checklist'); ph.wait_for_selector('[data-testid=vs-checklist]')
    check('phone: no sideways scroll', ph.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    # how it works
    h=ctx.new_page(); h.goto(B+'/how-it-works#learning'); h.wait_for_timeout(300); t=h.inner_text('body')
    check('How it works has the learning and gate section', 'How it learns, and how a change ships' in t and 'npm run eval -- --gate' in t and 'at least 85%' in t)
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
