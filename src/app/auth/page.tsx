'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginForm, loginSchema, verifyemailSchema } from '@/schemas/auth.schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import{Loader, Lock, LogIn, MailQuestionMark} from 'lucide-react'
import { api } from '@/lib/api/axios';
import ServerError from '@/components/serverError';
import Result from '@/lib/Result';
import Image from 'next/image';

interface LoginResponse {
    role: string;
    email:string;
    id:string;
}

export default function Auth(){
    const router = useRouter();
    const [showForm , setShowform] = useState(false);
    const [disableLoginBtn ,setdisableLoginBtn] = useState(false);
    const [disableVerifyBtn ,setdisableVerifyBtn] = useState(false);
    const [serverError , setServerError] = useState(false);

    const form = useForm<loginForm>({
        resolver:zodResolver(loginSchema),
        mode:"onBlur",       
    });

    const verifyform = useForm<verifyemailSchema>({
        resolver:zodResolver(verifyemailSchema),
        mode:"onBlur",
    });

    const loginBtnClicked = ()=> {
        // console.log("loginBtnClicked");
        setdisableLoginBtn(true);
         setTimeout(()=>{
            setdisableLoginBtn(false);
        } , 15000) //15sec
    }
    

    const login = async (payload: loginForm) => {
        loginBtnClicked();
        try{
            const {data} = await api.post<Result<LoginResponse>>("auth/login" , payload);
            
            if(data.Success){ 
            if(data.Token !== undefined){
                localStorage.setItem("accesstoken" , data.Token);
                document.cookie = `accesstoken=${encodeURIComponent(data.Token)}; path=/; SameSite=Lax`;
            }
            if(data.Data?.role === "owner"){
                router.push("/home");
            }
            }
            
            else if(data.Message && data.Message.includes('Wrong Password')){
            form.setError('password',{
                type:"server",
                message:"Wrong Password"
            })
            }else{ form.setError('email' , {
                type:"server",
                message: data.Message
            })}

            setdisableLoginBtn(false);

        }catch(e){ 
            setServerError(true);
            form.setError('email' , {
                type:"server",
                message: "Server error try again after some time"
            })
            setdisableLoginBtn(false);
        }
    };

    const verifybtnClicked =  ()=> {  // console.log("loginBtnClicked");
        setdisableVerifyBtn(true);
         setTimeout(()=>{
            setdisableVerifyBtn(false);
        } , 15000) //15sec
     };

    const verify = async (payload:verifyemailSchema)=>{
        verifybtnClicked();
         try{
            const {data} = await api.post<Result<unknown>>("auth/Verifyemail" , payload);
            verifyform.setError('email' , {
                type:"server",
                message: data.Message 
            })
         setdisableVerifyBtn(false);
        }catch(e){  
            setServerError(true);
            verifyform.setError('email' , {
                type:"server",
                message: "Internal server Error Try again After some time " 
            })
        setdisableVerifyBtn(false);
        }
    }


    return(
    <>
    <ServerError error={serverError} setservererror={() => setServerError(false)}/>
    <div className="flex justify-center items-center min-h-screen">
        <div className="w-[80vw] lg:w-[35vw]  md:w-[45vh] h-fitcontent xl:w-[25vw] rounded-3xl shadow ">
            <div className="w-full h-[30%]" > <Image src="/DineSpace.png" width={11120} height={220} loading="eager" className=" w-full h-full rounded-3xl" alt="" /> </div>
            <div className=" mt-1 flex flex-col p-5  gap-4 text-[#1B1C1A] text-[18px]" style={{fontWeight:"400"}}> 
                <form onSubmit={form.handleSubmit(login)} className="flex flex-col gap-3">
                    <label htmlFor="email">Enter Email Address:</label>
                    <div className={`${form.formState.errors.email? "border border-red-500":""} flex items-center p-3 shadow rounded`}>
                        <MailQuestionMark className='text-[#17375E] mr-2' />
                        <input
                            id="email"
                            className="bg-transparent w-full h-full outline-none"
                            type="email"
                            placeholder="example@Dinespace.com"
                            {...form.register('email')}
                        />
                    </div>
                    {form.formState.errors.email && (
                        <span className="text-red-500 text-sm">{form.formState.errors.email.message as string}</span>
                    )}

                    <div className=" flex justify-between">
                        <label htmlFor="password">Password:</label>
                        <a className="text-[12px] font-bold text-[#A13924] cursor-pointer">Forget Password?</a>
                    </div>
                    <div className={`flex items-center p-3 shadow rounded ${form.formState.errors.password? "border border-red-500":""}`}>
                        <Lock className='text-[#17375E] mr-2' />
                        <input
                            id="password"
                            className={`bg-transparent w-full h-full outline-none `}
                            type="password"
                            placeholder="Enter Your Password"
                            {...form.register('password')}
                        />
                    </div>
                    {form.formState.errors.password && (
                        <span className={`text-red-500 text-sm`}>{form.formState.errors.password.message as string}</span>
                    )}

                    <button type="submit" disabled = {disableLoginBtn} className="bg-[#A13924] flex items-center justify-center rounded h-8 text-white cursor-pointer hover:scale-98 transition-all duration-500 " 
                    >Sign In {disableLoginBtn?<Loader  className={`ml-2 animate-spin `}  />:<LogIn className='ml-2' />}</button>
                </form>

                <button  className=" rounded h-8 text-[#040505] border-2 border-[#17375E] cursor-pointer hover:scale-98 transition-all duration-500" 
                onClick={()=>{ const a = !showForm; setShowform(a)}}> Sign Up & Serve Better</button>
                
                {showForm && showForm == true ?
                <form onSubmit={verifyform.handleSubmit(verify)}>
                    <div className='flex flex-col  gap-1 bg-gray-200 rounded shadow p-2 transition-all duration-1100 '>
                        <label htmlFor="">Enter Email Address:</label>
                        <div className='flex flex-1 items-center gap-2 flex-wrap justify-between'>
                            <div className='flex items-center bg-white rounded shadow h-8 w-[65%] pl-3 pr-2'>
                                <MailQuestionMark className='text-[#17375E] mr-2' />
                                <input className="bg-transparent w-full h-full outline-none" type="email" {...verifyform.register('email')} placeholder="example@Dinespace.com"/>
                            </div>
                       
                            <button type="submit" disabled = {disableVerifyBtn} className='bg-[#A13924] w-fit pl-2 pr-2 rounded flex items-center h-8 text-white cursor-pointer hover:scale-98 transition-all duration-500'>{disableVerifyBtn? <>Sending <Loader className='ml-2 animate-spin' /></> : "Send Email"}</button>
                                 {verifyform.formState.errors.email && (
                                 <span className="text-red-500 text-sm">{verifyform.formState.errors.email.message}</span>
                                 )}
                        </div>
                    </div>
                </form>
                :""}
            </div>
            <div className='h-10 w-full text-[#A13924]  cursor-pointer flex justify-around items-center' style={{borderRadius:"0px 0px 10px 10px", boxShadow:"0px -1px 0px 0px"}}>
                <a> About DineSpace</a>
                <a> Support@DineSpace.com</a>
            </div>

        </div>
    </div>
    </>
    );
}