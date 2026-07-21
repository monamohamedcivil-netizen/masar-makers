"use client";

import HeadingEditor from "./HeadingEditor";

type Props = {
    block:any;
    data:any;
    onChange:(data:any)=>void;
};

export default function BlockEditor({
    block,
    data,
    onChange,
}:Props){

    switch(block.block_type){

        case "heading":
            return (
                <HeadingEditor
                    data={data}
                    onChange={onChange}
                />
            );

        default:
            return (
                <>Unknown Block</>
            );
    }

}