import React from 'react';
import ReactDOM from 'react-dom';

// import App from './App';
// import reportWebVitals from './reportWebVitals';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

const jsx = (
  <div>
    <span>big-react</span>
  </div>
)
const root = document.getElementById('root');


ReactDOM.createRoot(root).render(jsx);

console.log(React);
console.log(jsx);
console.log(ReactDOM, "ReactDOM")


