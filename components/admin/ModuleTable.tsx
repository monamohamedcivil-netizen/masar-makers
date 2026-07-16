type Props = {
  modules: any[];
};

export default function ModuleTable({
  modules,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border">

      <table className="w-full">

        <thead className="bg-slate-100">

          <tr>

            <th className="p-3 text-right">
              #
            </th>

            <th className="p-3 text-right">
              المحور
            </th>

            <th className="p-3 text-right">
              المدة
            </th>

          </tr>

        </thead>

        <tbody>

          {modules.map((module) => (

            <tr
              key={module.id}
              className="border-t"
            >

              <td className="p-3">
                {module.display_order}
              </td>

              <td className="p-3 font-bold">
                {module.title}
              </td>

              <td className="p-3">
                {module.duration}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}