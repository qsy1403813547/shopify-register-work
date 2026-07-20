import { presignUrl } from "@vercel/blob";


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
            url
        } = req.body;



        if(!url){

            return res.status(400).json({

                error:"Missing url"

            });

        }



        // =========================
        // 生成临时访问URL
        // =========================


        const presignedUrl =
        await presignUrl(url);



        return res.status(200).json({

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