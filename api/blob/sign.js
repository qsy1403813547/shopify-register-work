import { issueSignedToken, presignUrl } from "@vercel/blob";


export default async function handler(req,res){


    // CORS

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



        // 创建读取权限token

        const token =
        await issueSignedToken({

            pathname: pathname,

            operations:[
                "get"
            ]

        });



        // 生成临时URL

        const {
            presignedUrl
        } =
        await presignUrl(

            token,

            {

                pathname: pathname,

                operation:"get",

                validUntil:
                Date.now() + 10 * 60 * 1000

            }

        );



        return res.json({

            url:presignedUrl

        });



    }
    catch(error){


        console.error(error);


        return res.status(500).json({

            error:error.message

        });


    }


}