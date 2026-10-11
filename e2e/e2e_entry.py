from playwright.sync_api import sync_playwright
B='http://localhost:3111'; ok=True
def check(n,c):
    global ok
    print(('PASS ' if c else 'FAIL ')+n); ok=ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1280,'height':900}).new_page()
    errs=[]; pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(B+'/'); pg.wait_for_timeout(400)
    check('home is the dashboard entry', pg.get_by_role('heading',name='Dispute Advisor inside the Razorpay Dashboard').is_visible())
    check('7 rows with calls', pg.locator('tbody tr').count()==7 and pg.locator('tbody tr .inline-flex').count()>=7)
    check('sidebar: Disputes is current, Dispute Advisor is New', pg.locator('nav[aria-label="Dashboard menu (concept)"] a[aria-current=page]').inner_text().strip()=='Disputes' and 'New' in pg.locator('nav[aria-label="Dashboard menu (concept)"]').inner_text())
    check('greyed items are not links', pg.locator('nav[aria-label="Dashboard menu (concept)"] [aria-disabled=true]').count()>=6)
    check('concept label shown', pg.get_by_text('Concept view, not the real dashboard').is_visible())
    check('no Razorpay logo image', pg.locator('img').count()==0)
    pg.locator('tbody tr').nth(2).click(); pg.wait_for_url('**/disputes/C15'); check('row opens the dispute', True)
    pg.goto(B+'/'); pg.get_by_role('link',name='Open Dispute Advisor').click(); pg.wait_for_url('**/disputes'); check('banner button opens the list', True)
    check('breadcrumb on list', pg.get_by_role('navigation',name='Breadcrumb').inner_text().replace('\n',' ').startswith('Razorpay Dashboard'))
    pg.get_by_role('navigation',name='Breadcrumb').get_by_role('link',name='Razorpay Dashboard').click(); pg.wait_for_url(B+'/'); check('breadcrumb goes back to the dashboard', True)
    pg.goto(B+'/'); pg.locator('nav[aria-label="Dashboard menu (concept)"]').get_by_role('link',name='Dispute Advisor').click(); pg.wait_for_url('**/agent-studio'); check('sidebar Dispute Advisor opens setup', True)
    check('breadcrumb on setup', 'Agent setup' in pg.get_by_role('navigation',name='Breadcrumb').inner_text())
    pg.goto(B+'/results'); check('breadcrumb on results', 'Results' in pg.get_by_role('navigation',name='Breadcrumb').inner_text())
    # header
    pg.goto(B+'/disputes'); hh=pg.locator('header').bounding_box(); check('header is one 56px row on desktop', hh['height']<=58)
    check('active tab marked', pg.get_by_role('link',name='Disputes',exact=True).first.get_attribute('aria-current')=='page')
    ph=b.new_context(viewport={'width':390,'height':800}).new_page(); ph.goto(B+'/'); ph.wait_for_timeout(300)
    check('phone: no sideways scroll', ph.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    check('phone: sidebar hidden, list shown', not ph.locator('nav[aria-label="Dashboard menu (concept)"]').is_visible() and ph.locator('ul[aria-label=Disputes] li').count()==7)
    small=ph.evaluate("Array.from(document.querySelectorAll('header a, header nav a')).filter(a=>a.getBoundingClientRect().height<40).length"); check('phone: header links are tap-sized', small==0)
    check('phone: all three tabs visible without scrolling', ph.evaluate("Array.from(document.querySelectorAll('nav[aria-label=Sections] a')).every(a=>{const r=a.getBoundingClientRect();return r.right<=window.innerWidth})"))

    pg.goto(B+'/how-it-works'); pg.wait_for_timeout(300)
    check('how: product tab shown first, others hidden', pg.locator('#panel-glance').is_visible() and not pg.locator('#panel-product').is_visible() and not pg.locator('#panel-answers').is_visible())
    pg.get_by_role('tab',name='Brief answers').click(); check('how: answers tab opens', pg.locator('#panel-answers').is_visible() and pg.locator('#panel-answers dl').first.locator('dt').count()==7)
    pg.get_by_role('tab',name='Sources and limits').click(); check('how: sources tab opens', pg.get_by_text('Limits you should know').is_visible())
    pg.goto(B+'/how-it-works#learning'); pg.wait_for_timeout(500); check('how: #learning opens on the product tab', pg.locator('#learning').is_visible())
    pg.goto(B+'/how-it-works#limits-x'); 
    ph2=b.new_context(viewport={'width':390,'height':800}).new_page(); ph2.goto(B+'/how-it-works'); ph2.get_by_role('tab',name='The product').click(); ph2.wait_for_timeout(300)
    check('how phone: no sideways scroll', ph2.evaluate('document.documentElement.scrollWidth<=window.innerWidth'))
    check('how phone: pipeline stacks', ph2.locator('section[aria-label="The pipeline"] li').first.bounding_box()['width']>300)
    print(errs); check('no console errors', not errs)
print('ALL OK' if ok else 'SOME FAILED')
