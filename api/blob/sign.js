import { createPresignedUrl } from "@vercel/blob";


export default async function handler(req,res){


    // ======================
    // CORS
    // ======================

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



    // 处理预检请求

    if(req.method === "OPTIONS"){

        return res.status(200).end();

    }



    try{


        const {
            pathname
        } = req.body;



        const url =
        await createPresignedUrl(
            pathname
        );



        return res.json({

            url:url

        });



    }
    catch(error){


        return res.status(500).json({

            error:error.message

        });


    }


}