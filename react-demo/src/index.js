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
  <span>big-react</span>
)

function App () {
  return (
    <span>big-react</span>
  )
}


const root = document.getElementById('root');


ReactDOM.createRoot(root).render(<App />);

console.log(React);
// console.log(jsx);
console.log(ReactDOM, "ReactDOM")


