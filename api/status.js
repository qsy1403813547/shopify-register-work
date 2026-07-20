export default async function handler(req,res){


    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );


    try{


        const {
            id
        } = req.query;



        if(!id){

            return res.status(400).json({
                error:"Missing id"
            });

        }



        const response = await fetch(

            `https://api.pruna.ai/v1/predictions/status/${id}`,

            {

                method:"GET",

                headers:{


                    "apikey":
                    process.env.PRUNA_API_KEY


                }

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