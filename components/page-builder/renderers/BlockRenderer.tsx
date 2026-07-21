import HeadingRenderer from "./HeadingRenderer";

export default function BlockRenderer({

    block,

}:any){

    switch(block.block_type){

        case "heading":

            return (

                <HeadingRenderer

                    data={block.data}

                />

            );

        default:

            return null;

    }

}