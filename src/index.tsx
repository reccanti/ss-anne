import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { CssBaseline, StylesProvider } from "@material-ui/core";

// interface State {
//   [name: string]: number;
// }

// interface BaseAction {
//   type: string;
// }

// interface AddPerson extends BaseAction {
//   type: "addPerson";
//   payload: {
//     name: string;
//     age: number;
//   };
// }

// interface RemovePerson extends BaseAction {
//   type: "removePerson";
//   payload: {
//     name: string;
//   };
// }

// interface EditAge extends BaseAction {
//   type: "editAge";
//   payload: {
//     name: string;
//     age: number;
//   };
// }

// type Action = AddPerson | RemovePerson | EditAge;

// function reducer(state: State, action: Action): State {
//   switch (action.type) {
//     case "addPerson": {
//       return {
//         ...state,
//         [action.payload.name]: action.payload.age,
//       };
//     }
//     case "removePerson": {
//       const newState = { ...state };
//       delete newState[action.payload.name];
//       return newState;
//     }
//     case "editAge": {
//       return {
//         ...state,
//         [action.payload.name]: action.payload.age,
//       };
//     }
//   }
//   return state;
// }

// // @ts-ignore
// window.coolDB = new WebRTCDatabase<State, Action>({}, reducer);
// // @ts-ignore
// window.coolDB.registerOnChange((state) => {
//   console.log("state changed");
//   console.log(state);
// });

// // @ts-ignore
// window.addPerson = (name: string, age: number) => {
//   // @ts-ignore
//   window.coolDB.update({
//     type: "addPerson",
//     payload: {
//       name,
//       age,
//     },
//   });
// };

// // @ts-ignore
// window.setupDB = () => {
//   // @ts-ignore
//   window.addPerson("Melissa", 90);
//   // @ts-ignore
//   window.addPerson("Hasan", 32);
//   // @ts-ignore
//   window.addPerson("Kartik", 80);
//   // @ts-ignore
//   console.log(coolDB.id);
// };

ReactDOM.render(
  <React.StrictMode>
    <StylesProvider>
      <CssBaseline />
      <App />
    </StylesProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
