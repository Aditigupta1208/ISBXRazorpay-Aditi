import playwright.sync_api as _s
_orig=_s.Browser.new_context
def _nc(self,*a,**k):
    c=_orig(self,*a,**k); c.add_init_script("try{localStorage.setItem('da:v1:tips-seen','0')}catch(e){}"); return c
_s.Browser.new_context=_nc
