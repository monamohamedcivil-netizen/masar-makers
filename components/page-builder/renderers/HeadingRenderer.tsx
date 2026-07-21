type Props={

    data:any;

};

export default function HeadingRenderer({

    data,

}:Props){

    const Tag=data.size;

    return (

        <Tag
            style={{

                color:data.color,

                textAlign:data.align,

            }}
        >

            {data.title}

        </Tag>

    );

}