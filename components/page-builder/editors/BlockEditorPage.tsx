"use client";

import { useState, useTransition } from "react";
import BlockEditor from "./BlockEditor";
import { updatePanelBlockData } from "@/lib/actions/panel-builder";

type Props = {
  block: any;
};

export default function BlockEditorPage({
  block,
}: Props) {

  const [data, setData] = useState(block.data ?? {});

  const [isPending, startTransition] = useTransition();

  function save() {

    startTransition(async () => {

      await updatePanelBlockData({

        id: block.id,

        data,

      });

      location.reload();

    });

  }

  return (

    <div className="space-y-6">

      <div className="rounded-xl border p-6 bg-white">

        <h2 className="text-xl font-black">

          {block.title}

        </h2>

        <p className="text-sm text-slate-500">

          {block.block_type}

        </p>

      </div>

      <div className="rounded-xl border p-6 bg-white">

        <BlockEditor

          block={block}

          data={data}

          onChange={setData}

        />

      </div>

      <button

        onClick={save}

        disabled={isPending}

        className="rounded-xl bg-[#07152E] px-6 py-3 font-black text-white"

      >

        {isPending ? "Saving..." : "Save"}

      </button>

      <div className="rounded-xl border bg-slate-50 p-6">

        <pre className="text-xs">

          {JSON.stringify(data, null, 2)}

        </pre>

      </div>

    </div>

  );

}