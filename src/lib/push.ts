/** Web Push: durable subscriptions, strict public service allowlist, bounded sends. */
import webpush from 'web-push';
import { timingSafeEqual } from 'crypto';
import type { PushSubscription as WebPushSubscription } from 'web-push';
import { readDocument, mutateDocument } from './storage';
const generated = process.env.NODE_ENV !== 'production' && !process.env.VAPID_PRIVATE ? webpush.generateVAPIDKeys() : null;
const PUBLIC_KEY=process.env.NEXT_PUBLIC_VAPID_PUBLIC || generated?.publicKey || '';
const PRIVATE_KEY=process.env.VAPID_PRIVATE || generated?.privateKey || '';
if(PUBLIC_KEY && PRIVATE_KEY)webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:push@example.invalid',PUBLIC_KEY,PRIVATE_KEY);
export function getVapidPublicKey(){return PUBLIC_KEY;}
// CWE-918: never send HTTP requests to arbitrary subscription endpoints.
const HOSTS=new Set(['fcm.googleapis.com','push.services.mozilla.com','updates.push.services.mozilla.com']);
export function isValidPushEndpoint(endpoint: unknown):boolean {
  if(typeof endpoint!=='string' || endpoint.length>2048)return false;
  try {const u=new URL(endpoint);return u.protocol==='https:' && !u.port && !u.username && !u.password && !u.hash && HOSTS.has(u.hostname) && u.pathname!=='/';}
  catch{return false;}
}
type StoredSub={sub:WebPushSubscription;topics:string[];addedAt:number};
const empty=():StoredSub[]=>[];
export async function addSubscription(sub:WebPushSubscription,opts:{topics?:string[];userAgent?:string}={}) {
  if(!PUBLIC_KEY || !PRIVATE_KEY || !isValidPushEndpoint(sub.endpoint))return false;
  return mutateDocument('push',empty(),all=>{
    const prev=all.find(x=>x.sub.endpoint===sub.endpoint);
    // Knowing the public capability URL alone cannot replace its keys.
    if(prev && (prev.sub.keys.auth!==sub.keys.auth || prev.sub.keys.p256dh!==sub.keys.p256dh))return false;
    if(!prev && all.length>=10000)return false;
    if(prev)prev.topics=opts.topics || ['breaking'];else all.push({sub,topics:opts.topics || ['breaking'],addedAt:Date.now()});return true;
  });
}
export async function removeSubscription(endpoint:string,auth:string) {
  return mutateDocument('push',empty(),all=>{
    const i=all.findIndex(x=>x.sub.endpoint===endpoint);if(i<0)return false;
    const a=Buffer.from(auth);const b=Buffer.from(all[i].sub.keys.auth);
    if(a.length!==b.length || !timingSafeEqual(a,b))return false;all.splice(i,1);return true;
  });
}
export async function listSubscriptions(topic?:string){const all=await readDocument('push',empty());return topic?all.filter(s=>s.topics.includes(topic)):all;}
export async function getSubscriptionCount(){return(await listSubscriptions()).length;}
export type PushPayload={title:string;body:string;icon?:string;badge?:string;tag?:string;url?:string;image?:string;topic?:string;requireInteraction?:boolean;data?:Record<string,unknown>};
export async function sendPush(payload:PushPayload){
  if(!PUBLIC_KEY || !PRIVATE_KEY)return {sent:0,failed:0,disabled:true};
  const targets=await listSubscriptions(payload.topic);let sent=0;let failed=0;
  const message=JSON.stringify({title:payload.title,body:payload.body,icon:'/icons/icon-192.png',badge:'/icons/badge-72.png',tag:payload.tag,url:payload.url || '/',image:payload.image,requireInteraction:!!payload.requireInteraction,data:{url:payload.url || '/'}});
  for(let i=0;i<targets.length;i+=20)await Promise.all(targets.slice(i,i+20).map(async({sub})=>{
    if(!isValidPushEndpoint(sub.endpoint)){failed++;return;}
    try{await webpush.sendNotification(sub,message,{TTL:900,urgency:'high',timeout:5000});sent++;}
    catch(e){failed++;const status=(e as {statusCode?:number}).statusCode;if(status===404 || status===410)await removeSubscription(sub.endpoint,sub.keys.auth);}
  }));
  // Never expose push endpoint capability URLs in HTTP responses/logs.
  return {sent,failed};
}
