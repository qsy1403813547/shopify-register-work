export default async function handler(req,res){


    // CORS

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );


    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    if(req.method === "OPTIONS"){
        return res.status(200).end();
    }



    if(req.method !== "POST"){

        return res.status(405).json({
            error:"Method not allowed"
        });

    }



    try{


        const {
            personImage,
            garmentImage
        } = req.body;



        const response = await fetch(
            "https://api.pruna.ai/v1/predictions",
            {

                method:"POST",


                headers:{


                    "Content-Type":
                    "application/json",


                    "Model":
                    "p-image-try-on",


                    "apikey":
                    process.env.PRUNA_API_KEY

                },


                body:JSON.stringify({

                    input:{


                        person_image:
                        personImage,


                        garment_images:[

                            garmentImage

                        ],


                        prompt:""

                    }


                })


            }
        );



        const data =
        await response.json();



        console.log(data);



        return res.status(200).json(data);



    }
    catch(error){


        return res.status(500).json({

            error:error.message

        });


    }



}