import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode';

interface MyTokenPayload {
  userId: string;
  email: string;
  role:string;
  exp: number;
} 

const rolerouter: Record<string, string[]> = {
    admin:[ "/adminHome" , '/adminhome/:path*'],
    owner:["/home" , '/home/:path*']
}


// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    console.log("hit middleware")
    const pathName = request.nextUrl.pathname ;
    const IsPublicPath = pathName === '/auth' || pathName === '/';

    const cookieStore = await cookies()
   try{
    const token = cookieStore.get('accesstoken')?.value  || "Notoken";
        console.log("token and path")
        console.log(token);
        // console.log(IsPublicPath);
    if(token ==="Notoken" && !IsPublicPath){
        // console.log("hit logout notoken or path")
        return NextResponse.redirect(new URL('/auth', request.url));
    }
    if(token){
        const decode = jwtDecode<MyTokenPayload>(token);
        // console.log(decode);
        const isExpired = decode.exp ? decode.exp * 1000 < Date.now() : true ;
    if(isExpired){
        return NextResponse.redirect(new URL('/auth', request.url));
    }
    

    const usrRole = String(decode.role);
    console.log(usrRole);
    const allowedpath = rolerouter[usrRole]  || [];
    // console.log(allowedpath)
    const hasAcccess = allowedpath.some( path => pathName.startsWith(path));

     if (!hasAcccess) {
        cookieStore.delete('accesstoken');
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
        }
    }catch(e){
        console.log(e);
        cookieStore.delete('accesstoken');
    }

//   return NextResponse.redirect(new URL('/', request.url))
}
 
export const config = {
  matcher: ['/home', '/home/:path*'],
}