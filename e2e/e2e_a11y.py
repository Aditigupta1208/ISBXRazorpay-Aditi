from playwright.sync_api import sync_playwright
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
JS='''()=>{const lum=c=>{const m=c.match(/[\\d.]+/g).map(Number);const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(m[0])+.7152*f(m[1])+.0722*f(m[2])};let bad=0;document.querySelectorAll('p,span,li,td,th,label,dd,a,button,div').forEach(e=>{if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const cs=getComputedStyle(e);let bg=null,el=e;while(el){const b=getComputedStyle(el).backgroundColor;if(b&&!b.includes('rgba(0, 0, 0, 0)')&&b!=='transparent'){bg=b;break}el=el.parentElement}bg=bg||'rgb(255,255,255)';const a=lum(cs.color),b2=lum(bg);if((Math.max(a,b2)+.05)/(Math.min(a,b2)+.05)<4.5)bad++});return bad}'''
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport={'width':1280,'height':900}).new_page(); pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(400)
    pg.keyboard.press('Tab'); check('skip link is first focus', pg.evaluate("document.activeElement.innerText")=='Skip to content' and pg.evaluate("document.activeElement.getBoundingClientRect().width")>50)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(100); check('skip link moves focus to main', pg.evaluate("document.activeElement.id")=='main')
    for path in ['/','/disputes','/disputes/C06','/agent-studio','/evals','/how-it-works','/results']:
        pg.goto(B+path); pg.wait_for_timeout(300); n=pg.evaluate(JS); check(f'contrast {path} ({n} low)', n==0)
    pg.goto(B+'/disputes/C06'); pg.wait_for_timeout(400)
    btn=pg.get_by_role('button',name='Under the hood ›'); btn.focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    check('drawer: focus on Close', pg.evaluate("document.activeElement.innerText")=='Close')
    inside=True
    for i in range(30):
        pg.keyboard.press('Tab'); inside=inside and pg.evaluate("!!document.activeElement.closest('[role=dialog]')")
    check('drawer: Tab stays inside', inside)
    pg.keyboard.press('Shift+Tab'); check('drawer: Shift+Tab stays inside', pg.evaluate("!!document.activeElement.closest('[role=dialog]')"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    check('drawer closed', pg.get_by_role('dialog').count()==0)
    check('focus returns to opener', pg.evaluate("document.activeElement.innerText").startswith('Under the hood'))
    ph=b.new_context(viewport={'width':390,'height':800},has_touch=True).new_page(); ph.goto(B+'/disputes'); ph.wait_for_timeout(300)
    h=ph.evaluate("(()=>{const o=[];document.querySelectorAll('button[aria-pressed],button').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.height<40)o.push(e.innerText)});return o})()"); check('list buttons >=40px '+str(h), not h)
    ph.goto(B+'/disputes/C06'); ph.wait_for_timeout(300)
    def tap(sel):
        r=ph.locator(sel).first.evaluate("e=>{const b=e.getBoundingClientRect();const s=getComputedStyle(e,'::after');return [b.height, parseFloat(s.top)||0]}"); return r
    h2=ph.evaluate("(()=>{const o=[];document.querySelectorAll('a,button,summary').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||e.innerText==='Skip to content')return;const a=getComputedStyle(e,'::after');let h=r.height;if(a.position==='absolute'&&a.top.startsWith('-'))h+=Math.abs(parseFloat(a.top))*2;if(h<40)o.push((e.innerText||e.id).slice(0,20)+' '+Math.round(h))});return o})()"); check('C06 phone targets >=40 '+str(h2[:6]), not h2)
    check('phone no sideways scroll', not ph.evaluate('document.documentElement.scrollWidth>innerWidth'))
    b.close()
print('ALL OK' if ok else 'SOME FAILED')
