import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
LOG=(HERE+'/fake_requests.jsonl')
GOOD_FIGHT={"decision":"fight","confidence":"high","deciding_evidence":["E3","E4"],"missing_evidence":None,"reasoning_summary":"The customer used the service after the charge.","rule_applied":"Visa 13.2: merchant wins if the customer kept using the service.","contradictions":[],"economics_note":"Worth fighting at this amount.","win_probability_estimate":0.75,"defensible_amount":None,"evidence_flags":[],"evidence_slots":[{"evidence_id":"E1","slot":"term_and_conditions"},{"evidence_id":"E4","slot":"access_activity_log"}],"draft_response":"The customer accepted the renewal terms at sign-up. [E1] The customer kept using the service after the charge. [E4]","prevention_tip":"Send a renewal reminder."}
def pick(user):
    if 'FAILME' in user: return None
    if 'INVALIDME' in user: return {"oops":True}
    if 'ESCALATEME' in user: return {**GOOD_FIGHT,"decision":"escalate","confidence":"medium","missing_evidence":"Signed terms showing the renewal was agreed","deciding_evidence":["E1"],"defensible_amount":240.0,"win_probability_estimate":0.5,"draft_response":"The customer was charged USD 480 on 1 Aug 2026. [Razorpay] The support chat shows only that the customer said they might cancel. [E2]"}
    if 'clicked Cancel subscription' in user:
        return {**GOOD_FIGHT,"decision":"accept","confidence":"high","deciding_evidence":["E5"],"reasoning_summary":"The customer cancelled on 30 Jul, before the charge, so the rule favours the customer. [E5]","draft_response":None,"win_probability_estimate":0.15,"economics_note":"Fighting is unlikely to pay.","evidence_slots":[{"evidence_id":"E5","slot":"cancellation_proof"}]}
    return GOOD_FIGHT
import base64, re
def rebuttal(user):
    if 'FAILME' in user: return None
    if 'INVALIDME' in user: return {"oops":True}
    m=re.search(r'<draft>(.*?)</draft>',user,re.S); draft=m.group(1) if m else ''
    sents=[x.strip() for x in re.findall(r'[^.!?]+(?:[.!?]+(?:\s*\[[^\]]+\])*)?',draft) if re.sub(r'\[[^\]]*\]','',x).strip()]
    first=re.sub(r'\s*\[[^\]]*\]','',sents[0]).strip() if sents else ''
    base={"verdict":"weak_spot","strongest_objection":"The draft does not say when the customer last used the service.","objection_evidence_ids":["E1"],"weakest_sentence":first,"why_weak":"It gives no date.","fix_type":"reword","rewritten_sentence":"The customer accepted the terms and was told how to cancel [E1], and no cancellation was recorded [E4].","document_needed":None}
    if 'HOLDME' in user: return {**base,"verdict":"holds_up","weakest_sentence":None,"why_weak":None,"fix_type":"none","rewritten_sentence":None,"strongest_objection":"Nothing a reviewer would push on."}
    if 'LOSEME' in user: return {**base,"verdict":"likely_to_lose","fix_type":"none","rewritten_sentence":None,"strongest_objection":"The documents show the customer cancelled before the charge."}
    if 'BADQUOTE' in user: return {**base,"weakest_sentence":"A sentence the merchant never wrote."}
    if 'BADCITE' in user: return {**base,"rewritten_sentence":"The customer cancelled [E9]."}
    if 'ADDDOC' in user: return {**base,"fix_type":"add_document","rewritten_sentence":None,"document_needed":"The refund bank reference number."}
    return base
def extract(body):
    c=body['messages'][0]['content']; blk=c[0]; raw=base64.b64decode(blk['source']['data'])
    if b'UNREADABLE' in raw: return {"readable":False,"title":"","text":""}
    if b'CARDNUM' in raw: return {"readable":True,"title":"Receipt","text":"Paid with card 4111 1111 1111 1111"}
    if b'LONGDOC' in raw: return {"readable":True,"title":"Long doc","text":"x"*4500}
    return {"readable":True,"title":"Billing audit log","text":"Billing audit log, 30 Jul 2026: customer clicked Cancel subscription"}


def assist(tn,user):
    import re,json as J
    if 'SHORTFAIL' in user or 'FAILME' in user: return None
    if tn=='record_shortened_draft':
        m=re.search(r'<draft>(.*?)</draft>',user,re.S); draft=m.group(1).strip() if m else ''
        if 'SHORTBAD' in draft: return {"draft":"The customer cancelled on 2 Jul 2031. [E1]"}
        sents=re.findall(r'[^.!?]+[.!?]+(?:\s*\[[^\]]+\])*',draft); out=''
        for x in sents:
            n=(out+' '+x.strip()).strip()
            if len(n)>900: break
            out=n
        return {"draft":out}
    if tn=='record_key_facts':
        docs=re.findall(r'<evidence id="(E\d+)">(.*?)</evidence>',user,re.S); res=[]
        for i,t in docs:
            q=t.strip()[:40]
            facts=[{"fact":"What "+i+" shows: "+q,"quote":q}]
            if 'BADFACT' in user: facts.append({"fact":"Made up fact","quote":"this sentence is not in any document"})
            res.append({"id":i,"facts":facts})
        return {"documents":res}
    if tn=='record_learning_suggestion':
        m=re.search(r'Past results \(counts only\):\n(\{.*?\})\n',user,re.S); st=J.loads(m.group(1))
        rows=[r for r in st['byCode'] if r['fights']>0]; w=sorted(rows,key=lambda r:(r['won']/r['fights'],-r['fights']))[0]
        won=w['won']+(1 if 'LEARNBAD' in user else 0)
        return {"headline":"Your weakest reason is "+w['code']+".","finding":"You won "+str(w['won'])+" of "+str(w['fights'])+" fights on "+w['code']+".","cites":[{"code":w['code'],"won":won,"fights":w['fights']}],"suggestion":{"kind":"evidence","text":"Keep a dated record for every "+w['code']+" sale."},"note":"Small sample."}

class H(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def reply(self,code,obj):
        self.send_response(code); self.send_header('content-type','application/json'); self.end_headers(); self.wfile.write(json.dumps(obj).encode())
    def do_POST(self):
        body=json.loads(self.rfile.read(int(self.headers['content-length'])))
        if self.headers.get('authorization')!='Bearer gsk-test-key': return self.reply(401,{"error":{"message":"Invalid API Key"}})
        import os
        if os.environ.get('OVERLOAD_MODEL') and body['model']==os.environ['OVERLOAD_MODEL']: return self.reply(429,{"error":{"message":"rate limit reached"}})
        import time; time.sleep(float(os.environ.get('DELAY_MS','0'))/1000)
        tn=body['tools'][0]['function']['name']
        fc=body['tool_choice']
        if fc!={"type":"function","function":{"name":tn}}: return self.reply(400,{"error":{"message":"tool not forced"}})
        user=body['messages'][1]['content']
        norm={"model":body['model'],"max_tokens":body['max_tokens'],"system":body['messages'][0]['content'],"messages":[{"role":"user","content":user}],"tools":[{"name":tn,"input_schema":body['tools'][0]['function']['parameters']}],"tool_choice":{"type":"tool","name":tn}}
        open(LOG,'a').write(json.dumps({"path":self.path,"key":self.headers.get('authorization'),"body":norm})+chr(10))
        out=rebuttal(user) if tn=='record_bank_rebuttal' else assist(tn,user) if tn in ('record_shortened_draft','record_key_facts','record_learning_suggestion') else pick(user)
        if out is None: return self.reply(500,{"error":{"message":"boom"}})
        self.reply(200,{"choices":[{"message":{"role":"assistant","content":None,"tool_calls":[{"id":"c1","type":"function","function":{"name":tn,"arguments":json.dumps(out)}}]}}],"usage":{"prompt_tokens":1800,"completion_tokens":600}})
HTTPServer(('127.0.0.1',4014),H).serve_forever()
