import http.server,json
class H(http.server.BaseHTTPRequestHandler):
    def do_GET(s):
        s.send_response(200); s.send_header('Content-Type','application/json'); s.end_headers()
        s.wfile.write(json.dumps({"amount":1.0,"base":"USD","date":"2026-10-05","rates":{"EUR":0.89254,"GBP":0.75616,"INR":96.3}}).encode())
    def log_message(*a): pass
http.server.HTTPServer(('127.0.0.1',4011),H).serve_forever()
