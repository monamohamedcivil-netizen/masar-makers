export function getDefaultBlockData(type: string) {
  switch (type) {
    case "heading":
      return {
        title: "",
        subtitle: "",
        size: "h1",
        align: "right",
        color: "#07152E",
        background: "#FFFFFF",
        marginTop: 0,
        marginBottom: 24,
      };

    default:
      return {};
  }
}