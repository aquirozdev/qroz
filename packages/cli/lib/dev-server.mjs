import { createServer } from "node:http"
import { spawn } from "node:child_process"
import { explainError, inspect } from "@arc/core"
import { createWebRuntime } from "@arc/runtime-web"
import { createRecordingTracer } from "@arc/telemetry"
import { planDeployment } from "@arc/deployment"

const STUDIO_PREFIX = "/__arc"

function studioHtml(appName) {
  const escaped = JSON.stringify(appName)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Arc Studio · ${appName}</title>
<style>
:root{color-scheme:dark;--bg:#0b0d10;--panel:#11151a;--panel2:#171c22;--line:#252c35;--text:#f4f7fb;--muted:#93a0b2;--accent:#a7f3d0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text)}button{font:inherit}
.shell{display:grid;grid-template-columns:240px 1fr;min-height:100vh}.side{border-right:1px solid var(--line);padding:24px 18px;position:sticky;top:0;height:100vh}.brand{font-weight:750;letter-spacing:-.03em;font-size:20px}.app{color:var(--muted);margin-top:4px;font-size:13px}.status{margin:24px 0;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);font-size:13px}.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399;margin-right:8px}.nav{display:grid;gap:4px}.nav button{border:0;text-align:left;background:transparent;color:var(--muted);padding:9px 10px;border-radius:8px}.nav button.active{color:var(--text);background:var(--panel2)}main{padding:32px;max-width:1280px}.eyebrow{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.12em}.title{font-size:30px;font-weight:720;letter-spacing:-.04em;margin:6px 0 24px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:24px}.metric,.card{border:1px solid var(--line);background:var(--panel);border-radius:14px}.metric{padding:16px}.metric strong{display:block;font-size:22px}.metric span{color:var(--muted);font-size:12px}.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}.card{padding:18px}.card h2{font-size:15px;margin:0 0 14px}.module{border-top:1px solid var(--line);padding:14px 0}.module:first-of-type{border-top:0}.module-name{font-weight:650;margin-bottom:8px}.route{display:grid;grid-template-columns:62px 1fr auto;gap:10px;padding:7px 0;font:13px ui-monospace,SFMono-Regular,Menlo,monospace}.method{color:var(--accent)}.muted{color:var(--muted)}.pill{border:1px solid var(--line);border-radius:999px;padding:2px 7px;color:var(--muted);font:11px ui-monospace,SFMono-Regular,Menlo,monospace}.empty{color:var(--muted);padding:14px 0}.resource{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line)}.resource:first-of-type{border-top:0}.wide{grid-column:1/-1}.runner{display:grid;grid-template-columns:110px 1fr auto;gap:8px}.runner select,.runner input,.runner textarea{background:#0d1116;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:9px}.runner button{border:1px solid #365647;background:#17392d;color:#d1fae5;border-radius:9px;padding:9px 16px;cursor:pointer}.runner textarea{grid-column:1/-1;min-height:96px;resize:vertical;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}.response{margin-top:12px;background:#0d1116;border:1px solid var(--line);border-radius:10px;padding:12px;white-space:pre-wrap;overflow:auto;min-height:54px;font:12px ui-monospace,SFMono-Regular,Menlo,monospace}.explain{margin-top:10px;padding:10px 12px;border-left:3px solid #fbbf24;background:#1b1810;color:#fef3c7;font-size:13px;display:none}@media(max-width:820px){.shell{grid-template-columns:1fr}.side{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}main{padding:20px}.metrics{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="shell">
<aside class="side">
  <div class="brand">Arc Studio</div>
  <div class="app" id="app-name"></div>
  <div class="status"><span class="dot"></span>Local runtime connected</div>
  <div class="nav"><button class="active" data-target="overview">Overview</button><button data-target="request-runner">Requests</button><button data-target="security">Security</button><button data-target="deploy">Deploy</button></div>
</aside>
<main id="overview">
  <div class="eyebrow">Application</div>
  <div class="title" id="title">Loading…</div>
  <section class="metrics" id="metrics"></section>
  <section class="grid">
    <div class="card wide" id="request-runner"><h2>Request runner</h2>
      <div class="runner">
        <select id="runner-method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>
        <input id="runner-path" value="/" aria-label="Request path">
        <button id="runner-send">Send</button>
        <textarea id="runner-body" placeholder='JSON body (optional)'></textarea>
      </div>
      <pre class="response" id="runner-response">Ready.</pre>
      <div class="explain" id="runner-explain"></div>
    </div>
    <div class="card"><h2>Modules & endpoints</h2><div id="modules"></div></div>
    <div class="card"><h2>Capabilities</h2><div id="capabilities"></div></div>
    <div class="card"><h2>Recent requests</h2><div id="requests"></div></div>
    <div class="card" id="security"><h2>Authorization decisions</h2><div id="decisions"></div></div>
    <div class="card wide"><h2>Recent traces</h2><div id="traces"></div></div>
    <div class="card wide" id="deploy"><h2>Deployment plan</h2><div id="deployment"></div></div>
  </section>
</main>
</div>
<script>
const initialName=${escaped};
document.getElementById("app-name").textContent=initialName;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
for(const button of document.querySelectorAll(".nav button")){
 button.addEventListener("click",()=>{
  document.querySelectorAll(".nav button").forEach(item=>item.classList.toggle("active",item===button));
  document.getElementById(button.dataset.target)?.scrollIntoView({behavior:"smooth",block:"start"});
 });
}
async function explain(code){
 if(!code||!/^ARC\\d{4}$/.test(code)) return;
 const res=await fetch("/__arc/api/explain?code="+encodeURIComponent(code));
 if(!res.ok)return;
 const descriptor=await res.json();
 const node=document.getElementById("runner-explain");
 node.style.display="block";
 node.textContent=descriptor.title+" — "+descriptor.remediation;
}
document.getElementById("runner-send").addEventListener("click",async()=>{
 const method=document.getElementById("runner-method").value;
 const path=document.getElementById("runner-path").value||"/";
 const raw=document.getElementById("runner-body").value.trim();
 const output=document.getElementById("runner-response");
 const explainNode=document.getElementById("runner-explain");
 explainNode.style.display="none";explainNode.textContent="";
 output.textContent="Sending…";
 try{
  const response=await fetch(path,{method,headers:raw?{"content-type":"application/json"}:undefined,...(raw&&method!=="GET"&&method!=="HEAD"?{body:raw}:{})});
  const text=await response.text();
  let parsed;
  try{parsed=JSON.parse(text)}catch{parsed=undefined}
  output.textContent=method+" "+path+" → "+response.status+"\\n\\n"+(parsed?JSON.stringify(parsed,null,2):text||"(empty response)");
  if(parsed?.code) await explain(parsed.code);
  await loadActivity();
 }catch(error){output.textContent=String(error)}
});
async function load(){
 const res=await fetch("/__arc/api/graph");
 if(!res.ok) throw new Error("Unable to load Application Graph");
 const g=await res.json();
 document.getElementById("title").textContent=g.name;
 document.getElementById("app-name").textContent=g.name+" · graph v"+g.schemaVersion;
 const endpointCount=g.modules.reduce((n,m)=>n+m.endpoints.length,0);
 const jobs=g.modules.reduce((n,m)=>n+(m.jobs?.length||0),0);
 const workflows=g.modules.reduce((n,m)=>n+(m.workflows?.length||0),0);
 const metrics=[["Modules",g.modules.length],["Endpoints",endpointCount],["Jobs",jobs],["Workflows",workflows]];
 const metricsNode=document.getElementById("metrics");
 metricsNode.replaceChildren(...metrics.map(([label,value])=>{const n=el("div","metric");n.append(el("strong","",String(value)),el("span","",label));return n}));
 const modules=document.getElementById("modules");
 modules.replaceChildren(...g.modules.map(m=>{const wrap=el("div","module");wrap.append(el("div","module-name",m.name));if(!m.endpoints.length)wrap.append(el("div","empty","No HTTP endpoints"));for(const r of m.endpoints){const row=el("div","route");row.append(el("span","method",r.method),el("span","",r.path),el("span","pill",r.name||"endpoint"));wrap.append(row)}return wrap}));
 const caps=document.getElementById("capabilities");
 if(!g.capabilities.length)caps.replaceChildren(el("div","empty","No declared capabilities"));
 else caps.replaceChildren(...g.capabilities.map(c=>{const row=el("div","resource");row.append(el("span","",c.name),el("span","pill",c.resourceType||(c.configured?"configured":"runtime")));return row}));
 await loadActivity();
}
async function loadActivity(){
 const [requestsResponse,decisionsResponse,tracesResponse,planResponse]=await Promise.all([fetch("/__arc/api/requests"),fetch("/__arc/api/decisions"),fetch("/__arc/api/traces"),fetch("/__arc/api/plan")]);
 const requests=await requestsResponse.json();
 const decisions=await decisionsResponse.json();
 const traces=await tracesResponse.json();
 const plan=await planResponse.json();
 const requestNode=document.getElementById("requests");
 requestNode.replaceChildren(...(requests.length?requests.slice(-8).reverse().map(item=>{const row=el("div","resource");row.append(el("span","",item.method+" "+item.path),el("span","pill",item.status+" · "+item.durationMs+"ms"));return row}):[el("div","empty","No application requests yet")]));
 const decisionNode=document.getElementById("decisions");
 decisionNode.replaceChildren(...(decisions.length?decisions.slice(-8).reverse().map(item=>{const row=el("div","resource");const label=item.kind+(item.permission?" · "+item.permission:item.policy?" · "+item.policy:"");row.append(el("span","",label),el("span","pill",item.outcome));return row}):[el("div","empty","No authorization decisions yet")]));
 const traceNode=document.getElementById("traces");
 traceNode.replaceChildren(...(traces.length?traces.slice(-10).reverse().map(item=>{const row=el("div","resource");const owner=item.attributes?.["arc.endpoint"]||item.attributes?.["arc.listener"]||item.attributes?.["arc.workflow"]||item.requestId;row.append(el("span","",item.name+(owner?" · "+owner:"")),el("span","pill",item.requestId));return row}):[el("div","empty","No spans recorded yet")]));
 const deploymentNode=document.getElementById("deployment");
 const deploymentRows=plan.surfaces.map(surface=>{const row=el("div","resource");const access=surface.resourceAccess.length?surface.resourceAccess.map(item=>item.capability+" ["+(item.unrestricted?"*":item.operations.join(","))+"]").join(" · "):"no resource grants";row.append(el("span","",surface.id),el("span","pill",access));return row});
 for(const warning of plan.warnings){const row=el("div","explain",warning.code+" — "+warning.message);row.style.display="block";deploymentRows.unshift(row)}
 deploymentNode.replaceChildren(...(deploymentRows.length?deploymentRows:[el("div","empty","No execution surfaces")]))
}
load().catch(err=>{document.getElementById("title").textContent="Studio unavailable";document.getElementById("modules").textContent=err.message})
</script>
</body>
</html>`
}

async function readBody(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return chunks.length ? Buffer.concat(chunks) : undefined
}

function requestHeaders(incoming) {
  const headers = new Headers()
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(name, item)
    else if (value !== undefined) headers.set(name, value)
  }
  return headers
}

async function toWebRequest(request, port) {
  const host = request.headers.host ?? `127.0.0.1:${port}`
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await readBody(request)
  return new Request(`http://${host}${request.url ?? "/"}`, {
    method: request.method,
    headers: requestHeaders(request),
    ...(body ? { body } : {})
  })
}

async function sendWebResponse(response, outgoing) {
  outgoing.statusCode = response.status
  for (const [name, value] of response.headers) outgoing.setHeader(name, value)
  outgoing.end(new Uint8Array(await response.arrayBuffer()))
}

function openBrowser(url) {
  const command = process.platform === "darwin"
    ? ["open", [url]]
    : process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : ["xdg-open", [url]]
  const child = spawn(command[0], command[1], { detached: true, stdio: "ignore" })
  child.on("error", () => {})
  child.unref()
}

export async function runDev(application, options = {}) {
  const requestedPort = Number(options.port ?? 4000)
  if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
    throw new Error(`invalid port '${options.port}'`)
  }

  const graph = inspect(application)
  const deploymentPlan = planDeployment(application)
  const requestLog = []
  const decisionLog = []
  const traceLog = []
  let requestSequence = 0
  const server = createServer(async (request, response) => {
    try {
      const runtimePort = requestedPort || (typeof server.address() === "object" ? server.address()?.port : 4000) || 4000
      const pathname = new URL(request.url ?? "/", `http://127.0.0.1:${runtimePort}`).pathname
      if (pathname === STUDIO_PREFIX || pathname === `${STUDIO_PREFIX}/`) {
        response.statusCode = 200
        response.setHeader("content-type", "text/html; charset=utf-8")
        response.end(studioHtml(graph.name))
        return
      }
      if (pathname === `${STUDIO_PREFIX}/api/graph`) {
        response.statusCode = 200
        response.setHeader("content-type", "application/json; charset=utf-8")
        response.end(JSON.stringify(graph))
        return
      }
      if (pathname === `${STUDIO_PREFIX}/api/plan`) {
        response.statusCode = 200
        response.setHeader("content-type", "application/json; charset=utf-8")
        response.end(JSON.stringify(deploymentPlan))
        return
      }
      if (pathname === `${STUDIO_PREFIX}/api/requests`) {
        response.statusCode = 200
        response.setHeader("content-type", "application/json; charset=utf-8")
        response.end(JSON.stringify(requestLog))
        return
      }
      if (pathname === `${STUDIO_PREFIX}/api/decisions`) {
        response.statusCode = 200
        response.setHeader("content-type", "application/json; charset=utf-8")
        response.end(JSON.stringify(decisionLog))
        return
      }
      if (pathname === `${STUDIO_PREFIX}/api/traces`) {
        response.statusCode = 200
        response.setHeader("content-type", "application/json; charset=utf-8")
        response.end(JSON.stringify(traceLog))
        return
      }
      if (pathname === `${STUDIO_PREFIX}/api/explain`) {
        const code = new URL(request.url ?? "/", `http://127.0.0.1:${runtimePort}`).searchParams.get("code")
        const descriptor = code ? explainError(code) : undefined
        response.statusCode = descriptor ? 200 : 404
        response.setHeader("content-type", "application/json; charset=utf-8")
        response.end(JSON.stringify(descriptor ?? { error: "Unknown Arc error code" }))
        return
      }

      const requestId = `req_${++requestSequence}`
      const started = performance.now()
      const localDecisions = []
      const tracer = createRecordingTracer()
      let runtimeError
      const runtime = createWebRuntime(application, {
        tracer,
        onAuthorizationDecision(decision) {
          localDecisions.push(decision)
        },
        onError(error) {
          runtimeError = error
        }
      })
      const webRequest = await toWebRequest(request, runtimePort)
      const webResponse = await runtime.fetch(webRequest)
      const durationMs = Math.round((performance.now() - started) * 10) / 10
      const serializedError = runtimeError && typeof runtimeError === "object" && "toJSON" in runtimeError
        ? runtimeError.toJSON()
        : runtimeError
          ? { message: runtimeError instanceof Error ? runtimeError.message : String(runtimeError) }
          : undefined
      requestLog.push({
        id: requestId,
        method: request.method ?? "GET",
        path: pathname,
        status: webResponse.status,
        durationMs,
        at: new Date().toISOString(),
        ...(serializedError ? { error: serializedError } : {})
      })
      if (requestLog.length > 100) requestLog.splice(0, requestLog.length - 100)
      for (const decision of localDecisions) decisionLog.push({ requestId, at: new Date().toISOString(), ...decision })
      if (decisionLog.length > 200) decisionLog.splice(0, decisionLog.length - 200)
      for (const span of tracer.spans) traceLog.push({ requestId, at: new Date().toISOString(), ...span })
      if (traceLog.length > 300) traceLog.splice(0, traceLog.length - 300)
      await sendWebResponse(webResponse, response)
    } catch (error) {
      response.statusCode = 500
      response.setHeader("content-type", "application/json; charset=utf-8")
      response.end(JSON.stringify({ error: "Arc dev server failed", message: error instanceof Error ? error.message : String(error) }))
    }
  })

  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(requestedPort, options.host ?? "127.0.0.1", resolve)
  })

  const address = server.address()
  const port = typeof address === "object" && address ? address.port : requestedPort
  const baseUrl = `http://127.0.0.1:${port}`
  const studioUrl = `${baseUrl}${STUDIO_PREFIX}/`

  if (!options.silent) {
    console.log(`Arc dev · ${graph.name}`)
    console.log(`  app     ${baseUrl}`)
    console.log(`  studio  ${studioUrl}`)
  }

  if (options.open !== false) openBrowser(studioUrl)

  return { server, port, baseUrl, studioUrl, graph }
}
