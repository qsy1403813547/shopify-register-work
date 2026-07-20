import { issueSignedToken, presignUrl } from "@vercel/blob";


export default async function handler(req,res){


    // CORS

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );


    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );


    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    if(req.method === "OPTIONS"){
        return res.status(200).end();
    }



    try{


        const {
            pathname
        } = req.body;



        if(!pathname){

            return res.status(400).json({

                error:"Missing pathname"

            });

        }



        // =========================
        // 1. 创建读取token
        // =========================

        const token =
        await issueSignedToken({

            pathname: pathname,

            // 加这个
            storeId: process.env.BLOB_STORE_ID,

            // 加这个
            access:"private",

            operations:[
                "get"
            ]

        });


       



         // =========================
        // 2. 生成临时URL
        // =========================
        const presignedUrl = await presignUrl(

            token,

            {
                pathname,

                operation:"get",

                validUntil:
                Date.now() + 10 * 60 * 1000
            }

        );


        return res.status(200).json({

            url: presignedUrl

        });



    }
    catch(error){


        console.error(
            "签名错误:",
            error
        );


        return res.status(500).json({

            error:error.message

        });


    }


}