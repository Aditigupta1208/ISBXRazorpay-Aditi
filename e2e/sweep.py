from playwright.sync_api import sync_playwright
B='http://localhost:3111'
PAGES=['/','/disputes','/disputes/C06','/disputes/C13','/disputes/C04?review=1','/disputes/C06/packet','/results','/alerts','/agent-studio','/how-it-works','/evals','/usage']
bad=0
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in((390,844),(1280,800)):
        pg=b.new_page(viewport={'width':w,'height':h}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:120]))
        pg.on('console',lambda m:errs.append(m.text[:120]) if m.type=='error' else None)
        for u in PAGES:
            r=pg.goto(B+u); pg.wait_for_timeout(600)
            ov=pg.evaluate('document.documentElement.scrollWidth-innerWidth')
            st=r.status if r else 0
            flag=(ov>1) or st>=400
            if flag: bad+=1
            print(('FAIL' if flag else 'ok  '),w,u,'status',st,'overflow',ov)
        print('console errors',w,errs[:4])
    b.close()
print('ALL OK' if not bad else 'SOME FAILED')
