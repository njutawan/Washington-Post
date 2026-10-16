import { NextRequest } from 'next/server';
import { handlers } from '@/auth';
import { withApi, readBody } from '@/lib/http-security';
// Auth.js owns CSRF token validation for form posts; exact-Origin defense is
// still applied by the outer guard before allocating/parsing request bodies.
export const GET=withApi({name:'auth-read',max:120},handlers.GET);
export const POST=withApi({name:'auth-write',max:30,windowMs:900000},async(req:NextRequest)=>{
  const bytes=await readBody(req,8192);
  return handlers.POST(new NextRequest(req.url,{method:'POST',headers:req.headers,body:new Uint8Array(bytes)}));
});
