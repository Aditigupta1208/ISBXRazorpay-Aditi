import os as _os
HERE=_os.path.dirname(_os.path.abspath(__file__))
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
LOG=(HERE+'/fake_requests.jsonl')
GOOD_FIGHT={"decision":"fight","confidence":"high","deciding_evidence":["E3","E4"],"missing_evidence":None,"reasoning_summary":"The customer used the service after the charge.","rule_applied":"Visa 13.2: merchant wins if the customer kept using the service.","contradictions":[],"economics_note":"Worth fighting at this amount.","win_probability_estimate":0.75,"defensible_amount":None,"evidence_flags":[],"evidence_slots":[{"evidence_id":"E1","slot":"term_and_conditions"},{"evidence_id":"E4","slot":"access_activity_log"}],"draft_response":"The customer accepted the renewal terms at sign-up. [E1] The customer kept using the service after the charge. [E4]","prevention_tip":"Send a renewal reminder."}
def pick(user):
    if 'FAILME' in user: return None
    if 'INVALIDME' in user: return {"oops":True}
    if 'FLAGME' in user: return {**GOOD_FIGHT,"evidence_flags":[{"evidence_id":"E5","flag":"instruction_like"},{"evidence_id":"E2","flag":"contradiction"},{"evidence_id":"E1","flag":"unreadable"}]}
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
class H(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def do_POST(self):
        body=json.loads(self.rfile.read(int(self.headers['content-length'])))
        open(LOG,'a').write(json.dumps({"path":self.path,"key":self.headers.get('x-api-key'),"body":body})+"\n")
        user=body['messages'][0]['content']; user=user if isinstance(user,str) else json.dumps(user)
        tools=body.get('tools') or [{}]
        tn=tools[0].get('name')
        out=extract(body) if tn=='record_document_text' else (rebuttal(user) if tn=='record_bank_rebuttal' else pick(user))
        if out is None:
            self.send_response(500); self.send_header('content-type','application/json'); self.end_headers(); self.wfile.write(b'{"type":"error","error":{"type":"api_error","message":"boom"}}'); return
        msg={"id":"msg_1","type":"message","role":"assistant","model":body['model'],"content":[{"type":"tool_use","id":"tu_1","name":tn or "record_dispute_decision","input":out}],"stop_reason":"tool_use","stop_sequence":None,"usage":{"input_tokens":1800,"output_tokens":700}}
        self.send_response(200); self.send_header('content-type','application/json'); self.end_headers(); self.wfile.write(json.dumps(msg).encode())
HTTPServer(('127.0.0.1',4010),H).serve_forever()
