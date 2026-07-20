import { issueSignedToken, presignUrl } from "@vercel/blob";


export default async function handler(req,res){


    res.setHeader(
        "Access-Control-Allow-Origin",
        "https://uat-dutties-p.myshopify.com"
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



        // ==========================
        // 生成签名Token
        // ==========================

        const {
            clientToken,
            clientSigningToken,
            delegationToken
        } = await issueSignedToken({

            pathname: pathname,

            onToken: ()=>{},

            allowedContentTypes:[
                "image/*"
            ]

        });



        // ==========================
        // 生成临时URL
        // ==========================

        const presignedUrl =
        await presignUrl(

            pathname,

            {

                clientSigningToken,

                delegationToken

            }

        );



        return res.json({

            url:presignedUrl

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