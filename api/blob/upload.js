import { put } from "@vercel/blob";


export default async function handler(req, res) {


    if(req.method !== "POST"){
        return res.status(405).end();
    }


    try {


        const formData = await req.formData();

        const file = formData.get("file");


        const blob = await put(

            file.name,

            file,

            {
                access:"private",
                addRandomSuffix:true
            }

        );


        return res.status(200).json({

            url: blob.url,

            pathname: blob.pathname

        });


    }
    catch(error){

        return res.status(500).json({
            error:error.message
        });

    }

}