import sys
from playwright.sync_api import sync_playwright
B="http://localhost:3111"; ok=True
def chk(n,c):
    global ok; print(("PASS " if c else "FAIL ")+n); ok = ok and bool(c)
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,tag in ((1280,900,"d"),(390,844,"p")):
        pg=b.new_page(viewport={"width":w,"height":h}); errs=[]
        pg.on("console",lambda m: errs.append(m.text) if m.type=="error" else None)
        pg.goto(B+"/how-it-works"); pg.wait_for_timeout(800)
        pg.click("#tab-answers"); pg.wait_for_timeout(300)
        chk(tag+" reading cards 4", pg.locator("[data-testid=reading-vs-rules] > div:visible").count()==4)
        t=pg.locator("[data-testid=reading-vs-rules]").inner_text()
        chk(tag+" C14 agent matched", "C14" in t and "agent matched" in t.lower())
        chk(tag+" misses shown", "also missed" in t)
        chk(tag+" metrics+failures", pg.locator("#metrics:visible").count()==1 and pg.locator("#failures:visible").count()==1)
        pg.click("#tab-merchants"); pg.wait_for_timeout(300)
        chk(tag+" merchants rows", (pg.locator("#heard tbody tr:visible").count()==13 or pg.locator("#heard ul li:visible").count()==13))
        pg.click("#tab-trust"); pg.wait_for_timeout(300)
        chk(tag+" tools+assumptions", pg.locator("#tools:visible").count()==1 and pg.locator("#assumptions:visible").count()==1)
        pg.click("#tab-product"); pg.wait_for_timeout(300)
        chk(tag+" tiers+position", pg.locator("#tiers:visible").count()==1 and pg.locator("#position:visible").count()==1)
        sw=pg.evaluate("document.documentElement.scrollWidth"); chk(tag+" no sideways scroll how", sw<=w)
        pg.screenshot(path=f"{sys.argv[1]}/p19_how_{tag}.png",full_page=True)
        pg.goto(B+"/results"); pg.wait_for_timeout(1200)
        chk(tag+" loop+interviews", pg.locator("#loop").count()==1 and pg.locator("[data-testid=interview-stories] li").count()==7)
        chk(tag+" no sideways scroll results", pg.evaluate("document.documentElement.scrollWidth")<=w)
        pg.screenshot(path=f"{sys.argv[1]}/p19_res_{tag}.png",full_page=True)
        pg.goto(B+"/evals"); pg.wait_for_timeout(800)
        chk(tag+" evals reading", pg.locator("[data-testid=reading-vs-rules] > div").count()==4)
        chk(tag+" no sideways scroll evals", pg.evaluate("document.documentElement.scrollWidth")<=w)
        pg.screenshot(path=f"{sys.argv[1]}/p19_ev_{tag}.png",full_page=False)
        chk(tag+" no console errors", not errs)
    b.close()
sys.exit(0 if ok else 1)
