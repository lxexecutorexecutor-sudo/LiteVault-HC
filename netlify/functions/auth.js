const crypto = require("crypto");
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const COOKIE = "lv_session";
const STATE_COOKIE = "lv_oauth_state";
const b64 = x => Buffer.from(x).toString("base64url");
const sign = value => crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
function cookies(event){return Object.fromEntries((event.headers.cookie||"").split(";").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf("=");return [x.slice(0,i),decodeURIComponent(x.slice(i+1))]}))}
function response(statusCode, body, headers={}){return {statusCode,headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(body)}}
function cookie(name,value,maxAge){return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
exports.handler=async(event)=>{
 const action=event.queryStringParameters?.action;
 if(!CLIENT_ID||!CLIENT_SECRET||!SESSION_SECRET||!REDIRECT_URI)return response(500,{error:"Faltan variables de entorno de Netlify."});
 if(action==="login"){
  const state=crypto.randomBytes(24).toString("hex");
  const url=new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id",CLIENT_ID);url.searchParams.set("response_type","code");url.searchParams.set("redirect_uri",REDIRECT_URI);url.searchParams.set("scope","identify");url.searchParams.set("state",state);
  return {statusCode:302,headers:{Location:url.toString(),"Set-Cookie":cookie(STATE_COOKIE,state,600)},body:""};
 }
 if(action==="callback"){
  const q=event.queryStringParameters||{};const c=cookies(event);
  if(!q.code||!q.state||q.state!==c[STATE_COOKIE])return {statusCode:400,body:"Validación OAuth fallida."};
  const form=new URLSearchParams({client_id:CLIENT_ID,client_secret:CLIENT_SECRET,grant_type:"authorization_code",code:q.code,redirect_uri:REDIRECT_URI});
  const tokenRes=await fetch("https://discord.com/api/oauth2/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form});
  if(!tokenRes.ok)return {statusCode:401,body:"No se pudo completar el inicio de sesión."};
  const token=await tokenRes.json();
  const userRes=await fetch("https://discord.com/api/users/@me",{headers:{Authorization:`Bearer ${token.access_token}`}});
  if(!userRes.ok)return {statusCode:401,body:"No se pudo verificar el perfil."};
  const user=await userRes.json();const payload=b64(JSON.stringify({id:user.id,username:user.username,global_name:user.global_name,avatar:user.avatar,discriminator:user.discriminator,exp:Date.now()+7*86400000}));
  const session=payload+"."+sign(payload);
  return {statusCode:302,headers:{Location:"/", "Set-Cookie":[cookie(COOKIE,session,604800),cookie(STATE_COOKIE,"",0)]},body:""};
 }
 if(action==="me"){
  const raw=cookies(event)[COOKIE];if(!raw)return response(401,{});
  const [payload,sig]=raw.split(".");if(!payload||!sig||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(sign(payload))))return response(401,{});
  const data=JSON.parse(Buffer.from(payload,"base64url").toString());if(data.exp<Date.now())return response(401,{});
  delete data.exp;return response(200,{user:data});
 }
 if(action==="logout")return response(200,{ok:true},{"Set-Cookie":cookie(COOKIE,"",0)});
 return response(404,{error:"Not found"});
};
