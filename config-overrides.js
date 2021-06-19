const { override, addWebpackPlugin } = require("customize-cra");
const webpack = require("webpack");

module.exports = override(
  addWebpackPlugin(
    new webpack.ContextReplacementPlugin(/\/peerjs\//, (data) => {
      delete data.dependencies[0].critical;
      delete data.dependencies[0].warn;
      return data;
    })
  )
);

// module.exports = function override(config) {
//   if (!config.plugins) {
//     config.plugins = [];
//   }
//   config.plugins.push(
//     new webpack.ContextReplacementPlugin(/\/peerjs\//, (data) => {
//       delete data.dependencies[0].critical;
//       return data;
//     })
//   );

//   return config;
// };
