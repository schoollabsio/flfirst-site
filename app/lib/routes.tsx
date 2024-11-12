const React = require("react");
const { json, useLoaderData } = require("react-router-dom");

const routes = [
  {
    path: "/",
    loader() {
      return json({ message: "Welcome to React Router!" });
    },
    Component() {
      let data = useLoaderData();
      return <h1>{data.message}</h1>;
    },
  },
];

export default routes;
